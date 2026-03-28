/**
 * Utility to generate floor names
 */
export function generateFloorName(floorNumber: number): string {
  if (floorNumber === 1) {
    return 'Ground Floor';
  } else if (floorNumber === 2) {
    return 'First Floor';
  } else {
    const ordinal = getOrdinalSuffix(floorNumber - 1);
    return `${floorNumber - 1}${ordinal} Floor`;
  }
}

function getOrdinalSuffix(num: number): string {
  if (num % 100 >= 11 && num % 100 <= 13) {
    return 'th';
  }
  switch (num % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
