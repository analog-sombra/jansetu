export function getComplaintPriority(affectedCitizensCount: number): number {
  if (affectedCitizensCount <= 10) {
    return 10;
  }

  if (affectedCitizensCount <= 50) {
    return 20;
  }

  if (affectedCitizensCount <= 200) {
    return 30;
  }

  return 40;
}
