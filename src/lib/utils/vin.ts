export interface VinDecodeResult {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine?: string;
  bodyClass?: string;
  driveType?: string;
  transmissionStyle?: string;
  plantCountry?: string;
  vehicleType?: string;
  valid: boolean;
  errors: string[];
}

interface NhtsaVariable {
  Variable: string;
  Value: string | null;
  ValueId: string | null;
}

interface NhtsaDecodeResponse {
  Results: NhtsaVariable[];
  Count: number;
  Message: string;
}

function getVariable(results: NhtsaVariable[], name: string): string | undefined {
  const found = results.find((r) => r.Variable === name);
  return found?.Value ?? undefined;
}

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cleanVin = vin.trim().toUpperCase();

  if (cleanVin.length !== 17) {
    return {
      vin: cleanVin,
      make: '', model: '', year: 0,
      valid: false,
      errors: ['VIN must be exactly 17 characters'],
    };
  }

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleanVin}?format=json`,
    { next: { revalidate: 86400 } } // cache 24h — VINs don't change
  );

  if (!res.ok) {
    throw new Error(`NHTSA VIN decode failed: ${res.status}`);
  }

  const data = (await res.json()) as NhtsaDecodeResponse;
  const results = data.Results;

  const errorText = getVariable(results, 'Error Text') ?? '';
  const errors = errorText ? [errorText] : [];

  const yearStr = getVariable(results, 'Model Year') ?? '';
  const year = yearStr ? parseInt(yearStr, 10) : 0;

  return {
    vin: cleanVin,
    make: getVariable(results, 'Make') ?? '',
    model: getVariable(results, 'Model') ?? '',
    year,
    trim: getVariable(results, 'Trim'),
    engine: [
      getVariable(results, 'Engine Number of Cylinders'),
      getVariable(results, 'Displacement (L)'),
      getVariable(results, 'Fuel Type - Primary'),
    ].filter(Boolean).join(' ') || undefined,
    bodyClass: getVariable(results, 'Body Class'),
    driveType: getVariable(results, 'Drive Type'),
    transmissionStyle: getVariable(results, 'Transmission Style'),
    plantCountry: getVariable(results, 'Plant Country'),
    vehicleType: getVariable(results, 'Vehicle Type'),
    valid: !errorText || errorText === '0 - VIN decoded clean. Check Digit (9th position) is correct',
    errors,
  };
}

export function buildVinSearchQuery(decoded: VinDecodeResult, partName: string): string {
  return [partName, decoded.make, decoded.model, decoded.year].filter(Boolean).join(' ');
}
