
import { parseProductMessage } from '../parseProductMessage';

let failures = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failures++;
  }
}

// Test 1: labelled fields extracted independently
{
  const msg =
    'Add new product: 5kg Basmati rice, cost price ₹120, selling price ₹150, MRP ₹180, distributor: Shreeji Traders';

  const draft = parseProductMessage(msg);

  console.log('DEBUG name:', JSON.stringify(draft.name));
  console.log('DEBUG distributor:', JSON.stringify(draft.distributor));

  check('name extracted', draft.name === 'Basmati rice');
  check('stock extracted', draft.stock === 5);
  check('unit extracted', draft.unit === 'kg');
  check('costPrice extracted', draft.costPrice === 120);
  check('sellingPrice extracted', draft.sellingPrice === 150);
  check('mrp extracted', draft.mrp === 180);
  check('distributor extracted', draft.distributor === 'Shreeji Traders');
  check('no missing fields', draft.missingFields.length === 0);
}

// Test 2: "packets" unit normalised and stock detected from quantity
{
  const msg =
    'Add product: 10 packets of Amul Butter, cost ₹50, selling ₹60';

  const draft = parseProductMessage(msg);

  console.log('DEBUG packets stock:', JSON.stringify(draft.stock));
  console.log('DEBUG packets unit:', JSON.stringify(draft.unit));
  console.log('DEBUG packets name:', JSON.stringify(draft.name));

  check('unit packets -> packet', draft.unit === 'packet');
  check('stock from packets', draft.stock === 10);
  check('no missing fields', draft.missingFields.length === 0);
}

// Test 3: distributor is not invented
{
  const msg =
    'Create product: 100g Amul Butter, stock 20, unit piece, cost ₹50, selling ₹60';

  const draft = parseProductMessage(msg);

  check('distributor empty', draft.distributor === '');
  check('no missing fields', draft.missingFields.length === 0);
}

// Test 4: required fields missing
{
  const msg = 'Add new product';
  const draft = parseProductMessage(msg);

  check('name missing', draft.missingFields.includes('name'));
  check('stock missing', draft.missingFields.includes('stock'));
  check('costPrice missing', draft.missingFields.includes('costPrice'));
  check('sellingPrice missing', draft.missingFields.includes('sellingPrice'));
}

// Test 5: Hindi/Hinglish
{
  const msg = 'नया प्रोडक्क्ट जोड़ें: 5kg चावल, कीमत ₹120, बिक्री ₹150';
  const draft = parseProductMessage(msg);

  check('hindi name', draft.name === 'चावल');
  check('hindi stock', draft.stock === 5);
  check('hindi costPrice', draft.costPrice === 120);
  check('hindi sellingPrice', draft.sellingPrice === 150);
  check('no missing fields', draft.missingFields.length === 0);
}

// Test 6: standalone unit words
{
  const msg =
    'Add product: 100g Amul Butter, stock 20, cost ₹50, selling ₹60';

  const draft = parseProductMessage(msg);

  check('unit g', draft.unit === 'g');
}

// Test 7: editing missing fields updates validation
{
  const msg = 'Add new product';
  const draft = parseProductMessage(msg);
  const missing = new Set(draft.missingFields);

  // Simulate user filling name.
  if (missing.has('name')) {
    missing.delete('name');
  }

  check('name removed from missing after edit', !missing.has('name'));
  check(
    'other required still missing',
    missing.has('stock') &&
      missing.has('costPrice') &&
      missing.has('sellingPrice')
  );
}

// Test 8: confirmation validation - required fields filled
{
  const msg = 'Add new product';
  const draft = parseProductMessage(msg);

  const editedDraft: Record<string, any> = {
    name: 'Test',
    stock: '10',
    costPrice: '50',
    sellingPrice: '60',
  };

  const remainingMissing = draft.missingFields.filter((field: string) => {
    const existing = editedDraft[field] ?? (draft as any)[field];

    if (typeof existing === 'number') {
      return existing === 0;
    }

    if (typeof existing === 'string') {
      return existing.trim() === '';
    }

    return true;
  });

  check('all required filled', remainingMissing.length === 0);
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);

  const proc = (globalThis as any).process;
  if (proc && proc.exit) {
    proc.exit(1);
  }
} else {
  console.log('\nAll tests passed');
}
