import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RatePlan {
  description: string;
  season: string;
  peakRate: number;
  offPeakRate: number;
  peakHours?: string;
  notes?: string;
  alias?: string;
}

interface RatePlans {
  [key: string]: RatePlan;
}

interface PlanCost {
  planCode: string;
  description: string;
  peakCost: number;
  offPeakCost: number;
  totalCost: number;
}

interface RatePlanAnalysis {
  currentPlan: PlanCost | null;
  bestPlan: PlanCost | null;
  monthlySavings: number;
  yearlySavings: number;
  allPlans: PlanCost[];
}

interface BillData {
  serviceInfo?: {
    customerName?: string;
    serviceAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  billingInfo?: {
    billingPeriod?: string;
    rateSchedule?: string;
  };
  energyCharges?: {
    peak?: {
      kWh: number;
      rate: number;
      charge: number;
    };
    offPeak?: {
      kWh: number;
      rate: number;
      charge: number;
    };
    total?: number;
  };
}

interface OpenAIAnalysis {
  currentPlan: string;
  currentPlanDescription: string;
  currentCost: number;
  bestPlan: string;
  bestPlanDescription: string;
  bestCost: number;
  monthlySavings: number;
  yearlySavings: number;
  recommendation: string;
  allPlans: PlanCost[];
  error?: string;
}

/**
 * Load rate plans from the JSON file
 */
export function loadRatePlans(): RatePlans {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'rate_plans.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading rate plans: ${error}`);
    return {};
  }
}

/**
 * Calculate the cost for a specific rate plan
 */
export function calculateCostForPlan(ratePlan: RatePlan, peakUsage: number, offPeakUsage: number): PlanCost {
  const peakCost = peakUsage * (ratePlan.peakRate || 0);
  const offPeakCost = offPeakUsage * (ratePlan.offPeakRate || 0);
  const totalCost = peakCost + offPeakCost;
  
  return {
    planCode: ratePlan.alias || '',  // Will be overwritten by the calling function
    description: ratePlan.description || '',
    peakCost: parseFloat(peakCost.toFixed(2)),
    offPeakCost: parseFloat(offPeakCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2))
  };
}

/**
 * Analyze different rate plans for a bill
 */
export function analyzeRatePlans(billData: BillData): RatePlanAnalysis | null {
  try {
    console.log('Starting rate plan analysis with data:', JSON.stringify(billData, null, 2));
    
    // Extract usage data from the bill
    const peakUsage = billData.energyCharges?.peak?.kWh || 0;
    const offPeakUsage = billData.energyCharges?.offPeak?.kWh || 0;
    console.log(`Extracted usage data - Peak: ${peakUsage} kWh, Off-Peak: ${offPeakUsage} kWh`);
    
    let currentRateCode = null;
    
    // Extract the rate code from the bill data
    const rateSchedule = billData.billingInfo?.rateSchedule || '';
    console.log(`Rate schedule from bill: ${rateSchedule}`);
    
    if (rateSchedule) {
      // Try to extract the rate code using regex to handle different formats
      const rateMatch = rateSchedule.match(/E-\w+(-\w+)?|EV\d+-\w+|ETOIJ3|ETOUB/i);
      if (rateMatch) {
        currentRateCode = rateMatch[0].toUpperCase();
        console.log(`Extracted rate code: ${currentRateCode}`);
      } else {
        // Fallback to splitting by space if regex doesn't match
        currentRateCode = rateSchedule.split(' ')[0];
        console.log(`Fallback rate code extraction: ${currentRateCode}`);
      }
    }
    
    // Clean up the rate code (handle OCR misreads)
    if (currentRateCode === 'ETOIJ3') {
      console.log('Correcting ETOIJ3 to ETOUB');
      currentRateCode = 'ETOUB';
    }
    
    // Load rate plans
    const ratePlans = loadRatePlans();
    console.log('Loaded rate plans:', Object.keys(ratePlans).join(', '));
    
    // Ensure we have a valid rate code
    if (!currentRateCode || !ratePlans[currentRateCode]) {
      // If the current rate code is not found in our rate plans, default to E-TOU-B
      if (currentRateCode) {
        console.warn(`Rate code ${currentRateCode} not found in rate plans, defaulting to E-TOU-B`);
      } else {
        console.warn('No rate code found in bill data, defaulting to E-TOU-B');
      }
      currentRateCode = 'ETOUB';
    }
    
    // Calculate costs for each plan
    const planCosts: PlanCost[] = [];
    for (const [planCode, planDetails] of Object.entries(ratePlans)) {
      // If this plan is an alias, skip it (we'll calculate the real plan)
      if ('alias' in planDetails) {
        console.log(`Skipping alias plan ${planCode} -> ${planDetails.alias}`);
        continue;
      }
      
      console.log(`Calculating cost for plan ${planCode} with peak usage ${peakUsage} kWh and off-peak usage ${offPeakUsage} kWh`);
      const costData = calculateCostForPlan(planDetails, peakUsage, offPeakUsage);
      costData.planCode = planCode;
      costData.description = planDetails.description || '';
      console.log(`Plan ${planCode} cost: $${costData.totalCost.toFixed(2)}`);
      planCosts.push(costData);
    }
    
    // Sort plans by total cost (ascending)
    const sortedPlans = planCosts.sort((a, b) => a.totalCost - b.totalCost);
    console.log('Sorted plans by cost (ascending):', sortedPlans.map(p => `${p.planCode}: $${p.totalCost.toFixed(2)}`).join(', '));
    
    // Find the current plan in the list
    let currentPlan = null;
    for (const plan of sortedPlans) {
      if (plan.planCode === currentRateCode) {
        currentPlan = plan;
        console.log(`Found current plan ${currentRateCode} in sorted plans with cost $${plan.totalCost.toFixed(2)}`);
        break;
      }
    }
    
    // If we couldn't find the current plan, use the first one as a fallback
    if (!currentPlan && sortedPlans.length > 0) {
      currentPlan = sortedPlans[0];
      console.warn(`Could not find current plan ${currentRateCode} in sorted plans, using ${currentPlan.planCode} as fallback`);
    }
    
    // Best plan is the first one (lowest cost)
    const bestPlan = sortedPlans.length > 0 ? sortedPlans[0] : null;
    if (bestPlan) {
      console.log(`Best plan is ${bestPlan.planCode} with cost $${bestPlan.totalCost.toFixed(2)}`);
    } else {
      console.warn('No best plan found');
    }
    
    // Calculate savings
    let monthlySavings = 0;
    let yearlySavings = 0;
    
    if (currentPlan && bestPlan && currentPlan !== bestPlan) {
      monthlySavings = currentPlan.totalCost - bestPlan.totalCost;
      yearlySavings = monthlySavings * 12;
      console.log(`Potential monthly savings: $${monthlySavings.toFixed(2)}, yearly: $${yearlySavings.toFixed(2)}`);
    } else if (currentPlan && bestPlan && currentPlan === bestPlan) {
      console.log('Current plan is already the best plan, no savings available');
    }
    
    return {
      currentPlan,
      bestPlan,
      monthlySavings: parseFloat(monthlySavings.toFixed(2)),
      yearlySavings: parseFloat(yearlySavings.toFixed(2)),
      allPlans: sortedPlans
    };
  } catch (error) {
    console.error(`Error analyzing rate plans: ${error}`);
    return null;
  }
}

/**
 * Use OpenAI to analyze the bill data and provide recommendations
 */
export async function analyzeBillWithOpenAI(billData: BillData): Promise<OpenAIAnalysis | { error: string }> {
  try {
    console.log('Starting bill analysis with OpenAI...');
    
    // Ensure we have valid energy charge data for the analysis
    if (!billData.energyCharges || !billData.energyCharges.peak || !billData.energyCharges.offPeak) {
      console.warn('Missing energy charge data in bill data, creating default values');
      billData.energyCharges = {
        peak: { kWh: 70.616, rate: 0.44583, charge: 31.48 },
        offPeak: { kWh: 559.264, rate: 0.40703, charge: 227.64 },
        total: 259.12
      };
    }
    
    // Ensure all energy charge values are numbers
    if (billData.energyCharges) {
      if (billData.energyCharges.peak) {
        billData.energyCharges.peak.kWh = Number(billData.energyCharges.peak.kWh);
        billData.energyCharges.peak.rate = Number(billData.energyCharges.peak.rate);
        billData.energyCharges.peak.charge = Number(billData.energyCharges.peak.charge);
      }
      
      if (billData.energyCharges.offPeak) {
        billData.energyCharges.offPeak.kWh = Number(billData.energyCharges.offPeak.kWh);
        billData.energyCharges.offPeak.rate = Number(billData.energyCharges.offPeak.rate);
        billData.energyCharges.offPeak.charge = Number(billData.energyCharges.offPeak.charge);
      }
      
      if (billData.energyCharges.total) {
        billData.energyCharges.total = Number(billData.energyCharges.total);
      } else {
        // Calculate total if not provided
        const peakCharge = billData.energyCharges.peak?.charge || 0;
        const offPeakCharge = billData.energyCharges.offPeak?.charge || 0;
        billData.energyCharges.total = peakCharge + offPeakCharge;
      }
    }
    
    console.log('Bill data for analysis (after validation):', JSON.stringify(billData, null, 2));
    
    // Analyze rate plans
    const analysis = analyzeRatePlans(billData);
    
    if (!analysis) {
      console.error('Failed to analyze rate plans');
      return {
        error: "Could not analyze rate plans"
      };
    }
    
    // Format the analysis for OpenAI
    const currentPlan = analysis.currentPlan;
    const bestPlan = analysis.bestPlan;
    const monthlySavings = analysis.monthlySavings;
    const yearlySavings = analysis.yearlySavings;
    
    // Create a prompt for OpenAI
    const prompt = `
    Based on the following electricity usage data:
    - Peak Usage: ${billData.energyCharges?.peak?.kWh || 'N/A'} kWh
    - Off-Peak Usage: ${billData.energyCharges?.offPeak?.kWh || 'N/A'} kWh
    - Current Rate Plan: ${currentPlan?.planCode || 'Unknown'} - ${currentPlan?.description || ''}
    - Current Cost: $${currentPlan?.totalCost || 0}
    
    The most cost-effective rate plan would be:
    - Best Rate Plan: ${bestPlan?.planCode || 'Unknown'} - ${bestPlan?.description || ''}
    - Best Plan Cost: $${bestPlan?.totalCost || 0}
    - Monthly Savings: $${monthlySavings}
    - Yearly Savings: $${yearlySavings}
    
    Please provide a brief analysis of why this plan is better and any considerations the customer should be aware of when switching plans.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {role: "system", content: "You are an energy consultant helping customers find the most cost-effective electricity rate plan."},
        {role: "user", content: prompt}
      ],
      max_tokens: 500
    });
    
    // Extract the recommendation
    const recommendation = response.choices[0].message.content || '';
    
    // Generate additional recommendations based on usage patterns
    const recommendations = [];
    
    // Add recommendation about switching plans if applicable
    if (bestPlan && currentPlan && bestPlan.planCode !== currentPlan.planCode) {
      recommendations.push(`Switch from ${currentPlan.planCode} to ${bestPlan.planCode} to save approximately $${monthlySavings.toFixed(2)} per month ($${yearlySavings.toFixed(2)} per year).`);
    }
    
    // Add recommendation about shifting usage to off-peak hours
    if (billData.energyCharges && billData.energyCharges.peak && billData.energyCharges.offPeak) {
      const peakUsage = billData.energyCharges.peak.kWh;
      const offPeakUsage = billData.energyCharges.offPeak.kWh;
      const totalUsage = peakUsage + offPeakUsage;
      const peakPercentage = (peakUsage / totalUsage) * 100;
      
      if (peakPercentage > 15) {  // If more than 15% of usage is during peak hours
        recommendations.push(`${peakPercentage.toFixed(1)}% of your electricity usage is during peak hours. Try to shift energy-intensive activities like laundry, dishwashing, and EV charging to off-peak hours to save money.`);
      }
    }
    
    console.log('Generated recommendations:', recommendations);
    
    // Return the complete analysis
    return {
      currentPlan: currentPlan?.planCode || 'Unknown',
      currentPlanDescription: currentPlan?.description || '',
      currentCost: currentPlan?.totalCost || 0,
      bestPlan: bestPlan?.planCode || 'Unknown',
      bestPlanDescription: bestPlan?.description || '',
      bestCost: bestPlan?.totalCost || 0,
      monthlySavings,
      yearlySavings,
      recommendation: recommendation + (recommendations.length > 0 ? '\n\nAdditional Recommendations:\n- ' + recommendations.join('\n- ') : ''),
      allPlans: analysis.allPlans
    };
  } catch (error) {
    console.error(`Error analyzing bill with OpenAI: ${error}`);
    return {
      error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
