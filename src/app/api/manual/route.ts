import { NextRequest, NextResponse } from 'next/server';

interface EnergyData {
  kWh: number;
  rate: number;
  charge: number;
}

interface BillData {
  serviceInfo: {
    customerName: string;
    serviceAddress: string;
    city: string;
    state: string;
    zip: string;
  };
  billingInfo: {
    billingPeriod: string;
    rateSchedule: string;
  };
  energyCharges: {
    peak: EnergyData;
    offPeak: EnergyData;
    total: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const billData: BillData = await request.json();
    
    // Validate the data
    if (!billData.serviceInfo || !billData.billingInfo || !billData.energyCharges) {
      return NextResponse.json(
        { success: false, error: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // Extract rate code from rate schedule
    let currentRateCode = 'E-TOU-B'; // Default
    if (billData.billingInfo?.rateSchedule) {
      const rateMatch = billData.billingInfo.rateSchedule.match(/E-\w+(-\w+)?|EV\d+-\w+/);
      if (rateMatch) {
        currentRateCode = rateMatch[0];
      }
    }
    
    // Rate plans and their pricing
    const ratePlans = {
      'E-1': { peak: 0.31, offPeak: 0.31 }, // Flat rate
      'E-TOU-B': { peak: 0.42, offPeak: 0.33 }, // Winter rates
      'E-TOU-C': { peak: 0.42, offPeak: 0.33 }, // Winter rates
      'E-TOU-D': { peak: 0.40, offPeak: 0.32 }, // Winter rates
      'EV2-A': { peak: 0.35, offPeak: 0.27 }  // Winter rates
    };
    
    // Calculate cost under each rate plan
    const peakKwh = billData.energyCharges?.peak?.kWh || 0;
    const offPeakKwh = billData.energyCharges?.offPeak?.kWh || 0;
    const totalKwh = peakKwh + offPeakKwh;
    
    const costByPlan: Record<string, number> = {};
    
    for (const [plan, rates] of Object.entries(ratePlans)) {
      const peakCost = peakKwh * (rates as any).peak;
      const offPeakCost = offPeakKwh * (rates as any).offPeak;
      costByPlan[plan] = peakCost + offPeakCost;
    }
    
    // Find the cheapest plan
    let cheapestPlan = Object.keys(costByPlan)[0];
    let lowestCost = costByPlan[cheapestPlan];
    
    for (const [plan, cost] of Object.entries(costByPlan)) {
      if (cost < lowestCost) {
        cheapestPlan = plan;
        lowestCost = cost;
      }
    }
    
    // Calculate potential savings
    const currentPlanCost = costByPlan[currentRateCode];
    const potentialSavings = currentPlanCost - lowestCost;
    
    // Generate analysis
    const analysis = {
      currentPlan: currentRateCode,
      currentPlanEstimatedCost: currentPlanCost.toFixed(2),
      recommendedPlan: cheapestPlan,
      recommendedPlanEstimatedCost: lowestCost.toFixed(2),
      potentialMonthlySavings: potentialSavings > 0 ? potentialSavings.toFixed(2) : '0.00',
      costByPlan: Object.entries(costByPlan).map(([plan, cost]) => ({
        plan,
        cost: cost.toFixed(2)
      }))
    };
    
    // Return the result with the analysis
    return NextResponse.json({
      success: true,
      data: {
        ...billData,
        analysis
      }
    });
  } catch (error) {
    console.error('Error processing manual entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
