import { Assignment } from '../App';

export function convertToJSONLD(assignment: Assignment) {
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": `${assignment.specialty} ${assignment.shiftType} Position`,
    "location": {
      "@type": "Place",
      "address": assignment.location
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": parseFloat(assignment.hourlyRate),
        "unitText": "HOUR"
      }
    },
    "employmentType": assignment.shiftType,
    "jobBenefits": [
      "Housing Stipend",
      "Meals Stipend",
      "Incidentals Stipend"
    ],
    "workHours": {
      "@type": "QuantitativeValue",
      "value": parseFloat(assignment.weeklyHours),
      "unitText": "HOUR"
    },
    "contractLength": {
      "@type": "QuantitativeValue",
      "value": parseFloat(assignment.contractLength),
      "unitText": "WEEK"
    },
    "expenses": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": parseFloat(assignment.housingExpenses) + 
               parseFloat(assignment.healthInsurance) +
               (assignment.transportationType === 'public' ? parseFloat(assignment.publicTransportCost) : 
                assignment.transportationType === 'rideshare' ? parseFloat(assignment.rideshareExpenses) :
                parseFloat(assignment.parkingCost))
    },
    "bonuses": {
      "signOn": parseFloat(assignment.signOnBonus),
      "completion": parseFloat(assignment.completionBonus)
    },
    "facility": {
      "@type": "Organization",
      "name": assignment.facilityName
    },
    "startDate": assignment.startDate,
    "plannedTimeOff": assignment.plannedTimeOff,
    "seasonality": assignment.seasonality
  };
}

export function exportAsJSON(assignment: Assignment) {
  const jsonldData = convertToJSONLD(assignment);
  const blob = new Blob([JSON.stringify(jsonldData, null, 2)], { type: 'application/json' });
  return URL.createObjectURL(blob);
} 