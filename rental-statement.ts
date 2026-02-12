// Constants and configurations
// ──────────────────────────────────────────────

const POINTS_PER_RENTAL = 1;

const PRICING_TIERS = {
  regular: {
    base: 2,
    thresholdDays: 2,
    extraRate: 1.5,
  },
  children: {
    base: 1.5,
    thresholdDays: 3,
    extraRate: 1.5,
  },
  new: {
    rate: 3,
    thresholdDays: 2,
    bonusPoints: 1,
  },
} as const;


// Type definitions
// ──────────────────────────────────────────────

type MovieCode = keyof typeof PRICING_TIERS;

type Movie = {
  title: string;
  code: MovieCode;
};

type Movies = Record<string, Movie>;

type Rental = {
  movieID: string;
  days: number;
};

type Customer = {
  name: string;
  rentals: Rental[];
};

type RentalSummary = {
  title: string;
  amount: number;
};

type RentalCharge = {
  amount: number;
  points: number;
};


// Pricing logic
// ──────────────────────────────────────────────

function calculateRegularCharge(days: number): RentalCharge {
  const { base, thresholdDays, extraRate } = PRICING_TIERS.regular;
  const amount = days > thresholdDays ? base + (days - thresholdDays) * extraRate : base;
  return { amount, points: POINTS_PER_RENTAL };
}

function calculateChildrenCharge(days: number): RentalCharge {
  const { base, thresholdDays, extraRate } = PRICING_TIERS.children;
  const amount = days > thresholdDays ? base + (days - thresholdDays) * extraRate : base;
  return { amount, points: POINTS_PER_RENTAL };
}

function calculateNewReleaseCharge(days: number): RentalCharge {
  const { rate, thresholdDays, bonusPoints } = PRICING_TIERS.new;
  const amount = days * rate;
  const points = days > thresholdDays ? POINTS_PER_RENTAL + bonusPoints : POINTS_PER_RENTAL;
  return { amount, points };
}

const chargeCalculators: Record<MovieCode, (days: number) => RentalCharge> = {
  regular: calculateRegularCharge,
  children: calculateChildrenCharge,
  new: calculateNewReleaseCharge,
};

function calculateRentalCharge(movie: Movie, days: number): RentalCharge {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error(`Rental days must be a positive integer (received: ${days})`);
  }
  const calculator = chargeCalculators[movie.code];
  if (!calculator) {
    console.log(`Unknown movie code: "${movie.code}"`);
    return { amount: 0, points: POINTS_PER_RENTAL };
    // throw new Error(`Unknown movie code: "${movie.code}"`);
  }

  return calculator(days);
}


// Statement formatting
// ──────────────────────────────────────────────

function formatStatementLine(label: string, amount: number): string {
  const LABEL_WIDTH = 30;
  const AMOUNT_WIDTH = 8;
  if (label.trim() === "") {
    return "-".repeat(LABEL_WIDTH + AMOUNT_WIDTH);
  }
  const displayLabel = label.length > LABEL_WIDTH ? label.slice(0, LABEL_WIDTH - 3) + "..." : label;

  return `${displayLabel.padEnd(LABEL_WIDTH)}${amount.toFixed(2).padStart(AMOUNT_WIDTH)}`;
}

function statement(customer: Customer, movies: Movies): string {
  let totalAmount = 0;
  let frequentRenterPoints = 0;
  const rentalSummaries: RentalSummary[] = [];

  for (const rental of customer.rentals) {
    const movie = movies[rental.movieID];
    if (!movie) {
      throw new Error(`Movie not found for ID: ${rental.movieID}`);
    }

    const { amount, points } = calculateRentalCharge(movie, rental.days);

    totalAmount += amount;
    frequentRenterPoints += points;
    rentalSummaries.push({ title: movie.title, amount });
  }

  const outputLines = [
    `Rental Record for ${customer.name}`,
    formatStatementLine("", 0),
    ...rentalSummaries.map((r) => formatStatementLine(r.title, r.amount)),
    formatStatementLine("", 0),
    formatStatementLine("Amount owed is", totalAmount),
    `Earned ${frequentRenterPoints} frequent renter points`,
  ];

  return outputLines.join("\n") + "\n";
}


// Demo data
// ──────────────────────────────────────────────

const customer: Customer = {
  name: "martin",
  rentals: [
    { movieID: "F001", days: 3 },
    { movieID: "F002", days: 1 },
    { movieID: "F003", days: 1 },
    { movieID: "F004", days: 1 },
  ],
};

const movies: Movies = {
  F001: { title: "Ran", code: "regular" },
  F002: { title: "Trois Couleurs: Bleu", code: "regular" },
  F003: { title: "Sunes Sommar", code: "children" },
  F004: { title: "Yara", code: "new" },
};

console.log(statement(customer, movies));