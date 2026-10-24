
import type { ChatProductDraft } from './types';

export function parseProductMessage(message: string): ChatProductDraft {
  let normalized = message;
  const extracted: Partial<ChatProductDraft> = {};
  const fieldNotes: Record<string, string> = {};

  const extract = (
    regex: RegExp,
    transform?: (value: string) => string | number
  ): string | number | undefined => {
    const match = normalized.match(regex);
    if (!match) return undefined;

    const value = transform ? transform(match[1].trim()) : match[1].trim();
    normalized = normalized.replace(match[0], ' ');
    return value;
  };

  // Extract labelled fields independently.
  extracted.minStock = extract(
    /(?:minimum|min)\s*stock\s*[:：-]?\s*(\d+(?:\.\d+)?)/iu,
    Number
  ) as number | undefined;

  extracted.stock = extract(
    /(?:^|[,\s])stock\s*[:：-]?\s*(\d+(?:\.\d+)?)/iu,
    Number
  ) as number | undefined;

  extracted.unit = extract(
    /(?:^|[,\s])unit\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  extracted.costPrice = extract(
    /(?:cost(?:\s*price)?|कीमत|दाम|मूल्य)\s*[:：-]?\s*[₹$]?\s*(\d+(?:\.\d+)?)/iu,
    Number
  ) as number | undefined;

  extracted.sellingPrice = extract(
    /(?:selling\s*price|selling|price|बिक्री|बेचने|बेच|sell)\s*[:：-]?\s*[₹$]?\s*(\d+(?:\.\d+)?)/iu,
    Number
  ) as number | undefined;

  extracted.mrp = extract(
    /mrp\s*[:：-]?\s*[₹$]?\s*(\d+(?:\.\d+)?)/iu,
    Number
  ) as number | undefined;

  extracted.barcode = extract(
    /barcode\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  extracted.category = extract(
    /category\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  extracted.nameHi = extract(
    /namehi\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  extracted.distributor = extract(
    /(?:distributor|supplier|dealer)\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  extracted.distributorPhone = extract(
    /(?:phone|mobile|contact)\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  extracted.leadDays = extract(
    /(?:lead\s*(?:time|days|day)?|delay)\s*[:：-]?\s*(\d+)/iu,
    Number
  ) as number | undefined;

  // Explicit name field.
  extracted.name = extract(
    /(?:^|[,\s])name\s*[:：-]?\s*([^\n,;]+)/iu
  ) as string | undefined;

  // Normalize text without changing its original capitalization.
  const cleanText = (value: string): string =>
    value
      .replace(/\s+/g, ' ')
      .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '')
      .replace(/[\s.:;,\-–]+$/, '')
      .trim();

  // Product quantity and unit patterns.
  const unitMap: Record<string, string> = {
    kilogram: 'kg',
    kilograms: 'kg',
    kilo: 'kg',
    kilos: 'kg',
    kg: 'kg',
    kgs: 'kg',
    gram: 'g',
    grams: 'g',
    gm: 'g',
    gms: 'g',
    g: 'g',
    litre: 'l',
    litres: 'l',
    liter: 'l',
    liters: 'l',
    ltr: 'l',
    ltrs: 'l',
    l: 'l',
    packet: 'packet',
    packets: 'packet',
    pkt: 'packet',
    pkts: 'packet',
    piece: 'piece',
    pieces: 'piece',
    pc: 'piece',
    pcs: 'piece',
    किलो: 'kg',
    ग्राम: 'g',
    लीटर: 'l',
    पैकेट: 'packet',
    पीस: 'piece',
  };

  const normalizeUnit = (raw: string): string => {
    const key = raw.toLowerCase().trim();
    return unitMap[key] ?? key;
  };

  const unitPattern =
    /kilograms?|kilos?|kgs?|grams?|gms?|g|litres?|liters?|ltrs?|ltr|l|packets?|pkts?|pkt|pieces?|pcs?|pc|किलो|ग्राम|लीटर|पैकेट|पीस/iu;

  const leadingQuantityPattern = new RegExp(
    `^(\\d+(?:\\.\\d+)?)\\s*(${unitPattern.source})\\b\\s*(?:(?:of|का|की|के)\\s*)?(.*)$`,
    'iu'
  );

  // Extract product name from messages such as:
  // "Add product: 5kg Basmati rice, cost price ₹120"
  if (!extracted.name) {
    const productMatch = message.match(
      /(?:नया\s+)?(?:(?:add|create)\s+)?(?:new\s+)?(?:product|item|प्रोडक्ट|प्रोडक्क्ट)\s*(?:जोड़ें|जोड़ने)?\s*[:：-]?\s*([^\n,;]+)/iu
    );

    if (productMatch) {
      let candidate = productMatch[1].trim();
      const qty = candidate.match(leadingQuantityPattern);

      if (qty) {
        candidate = qty[3].trim();

        if (extracted.stock === undefined) {
          extracted.stock = Number(qty[1]);
          fieldNotes.stock = `Detected stock ${extracted.stock} from quantity pattern.`;
        }

        if (!extracted.unit) {
          extracted.unit = normalizeUnit(qty[2]);
          fieldNotes.unit = `Detected unit "${extracted.unit}" from quantity pattern.`;
        }
      }

      extracted.name = cleanText(candidate);
    }
  }

  // Fallback for messages without an explicit product/item prefix.
  if (!extracted.name) {
    let candidate = message.trim();

    candidate = candidate.replace(
      /^(?:(?:please\s+)?(?:add|create|new|make)\s+(?:(?:a|an)\s+)?(?:new\s+)?(?:product|item)?|नया\s+|प्रोडक्ट\s+जोड़ें\s*[:：-]?)\s*/iu,
      ''
    );

    candidate = candidate.split(/[,\n;]/)[0].trim();

    const qty = candidate.match(leadingQuantityPattern);

    if (qty) {
      candidate = qty[3].trim();

      if (extracted.stock === undefined) {
        extracted.stock = Number(qty[1]);
        fieldNotes.stock = `Detected stock ${extracted.stock} from quantity pattern.`;
      }

      if (!extracted.unit) {
        extracted.unit = normalizeUnit(qty[2]);
        fieldNotes.unit = `Detected unit "${extracted.unit}" from quantity pattern.`;
      }
    }

    if (/^(?:add|create|new|product|item|add new product)$/iu.test(candidate)) {
      candidate = '';
    }

    extracted.name = cleanText(candidate);
  }

  // Detect a quantity when it appears before the product name.
  // Explicit stock values always take priority.
  if (extracted.stock === undefined) {
    const quantityMatch = message.match(
      /^\s*(?:(?:(?:please\s+)?(?:add|create)\s+)?(?:new\s+)?(?:product|item)\s*[:：-]?\s*|(?:नया\s+)?(?:प्रोडक्ट|प्रोडक्क्ट)\s*(?:जोड़ें|जोड़ने)?\s*[:：-]?\s*)?(\d+(?:\.\d+)?)\s*(kilograms?|kilos?|kgs?|kg|grams?|gms?|g|litres?|liters?|ltrs?|ltr|l|packets?|pkts?|pkt|pieces?|pcs?|pc)\b/iu
    );

    if (quantityMatch) {
      extracted.stock = Number(quantityMatch[1]);
      extracted.unit ??= normalizeUnit(quantityMatch[2]);
      fieldNotes.stock = `Detected stock ${extracted.stock} from quantity pattern.`;
    }
  }

  if (extracted.unit) {
    extracted.unit = normalizeUnit(String(extracted.unit));
  }

  if (extracted.name) {
    extracted.name = cleanText(String(extracted.name));
    fieldNotes.name = `Extracted name "${extracted.name}" from product/item label.`;
  }

  if (extracted.distributor) {
    extracted.distributor = cleanText(String(extracted.distributor));
  }

  if (extracted.nameHi) {
    extracted.nameHi = cleanText(String(extracted.nameHi));
  }

  const requiredFields: (keyof ChatProductDraft)[] = [
    'name',
    'stock',
    'costPrice',
    'sellingPrice',
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = extracted[field];

    if (value === undefined || value === null) return true;

    if (typeof value === 'number') {
      return value === 0 || Number.isNaN(value);
    }

    return typeof value === 'string' && value.trim() === '';
  }) as string[];

  const draft = {
    name: extracted.name ?? '',
    nameHi: extracted.nameHi ?? extracted.name ?? '',
    stock: extracted.stock ?? 0,
    unit: extracted.unit ?? 'piece',
    minStock: extracted.minStock ?? extracted.stock ?? 0,
    costPrice: extracted.costPrice ?? 0,
    sellingPrice: extracted.sellingPrice ?? 0,
    mrp: extracted.mrp ?? 0,
    distributor: extracted.distributor ?? '',
    distributorPhone: extracted.distributorPhone ?? '',
    leadDays: extracted.leadDays ?? 1,
    barcode: extracted.barcode ?? '',
    category: extracted.category ?? 'General',
    missingFields,
    fieldNotes,
  };

  return draft as ChatProductDraft;
}
