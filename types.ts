export enum PC_TYPE {
  OFFICE = 'Office',
  GAMING = 'Gaming',
  WORKSTATION = 'Workstation',
  SERVER = 'Server'
}

export enum PART_CATEGORY {
  CPU = 'CPU',
  MAINBOARD = 'Mainboard',
  RAM = 'RAM',
  GPU = 'GPU',
  STORAGE = 'Storage',
  PSU = 'PSU',
  CASE = 'Case',
  COOLER = 'Cooler',
  NIC = 'NIC', // Network Interface Card for Servers
  MONITOR = 'Monitor' // New Category
}

export interface Vendor {
  name: string;
  url: string;
  price: number;
  inStock?: boolean;
  phone?: string; // New: Contact Phone
  location?: string; // New: Location/Region
}

export interface Part {
  id: string;
  name: string;
  category: PART_CATEGORY;
  price: number; // Base/Best price for sorting
  image: string;
  brand: string;
  specs: {
    socket?: string;
    chipset?: string;
    memoryType?: string; // DDR4, DDR5
    wattage?: number;
    capacity?: string;
    speed?: string;
    cores?: number;
    vram?: string;
    ecc?: boolean;
    formFactor?: string; // ATX, mATX, ITX
    resolution?: string; // For Monitors
    refreshRate?: string; // For Monitors
    panelType?: string; // IPS, VA, OLED
    [key: string]: any; // Allow flexible specs from AI
  };
  vendors: Vendor[];
  rating: number;
  reasoning?: string; // Why this specific part was chosen
  alternatives?: Part[]; // List of comparison parts
}

export interface Build {
  parts: Partial<Record<PART_CATEGORY, Part>>;
  type: PC_TYPE;
  totalPrice: number;
  totalWattage: number;
  aiReasoning?: string; // New field for AI explanation
}

export interface SavedBuild extends Build {
  id: string;
  name: string;
  createdAt: number;
}

export interface PrebuiltConfig {
  id: string;
  name: string;
  description: string;
  type: PC_TYPE;
  totalPriceEstimate: number;
  partIds: string[]; // List of Part IDs to auto-fill
  image: string;
}

export interface CompatibilityIssue {
  severity: 'error' | 'warning';
  message: string;
  component: string;
}

export interface GeminiSuggestion {
  reasoning: string;
  parts: {
    category: string;
    name: string;
    estimatedPrice: number;
  }[];
}

export interface UserRequirementAnalysis {
  machine_type: 'office' | 'gaming' | 'workstation' | 'server';
  budget: {
    amount: number | string;
    currency: string;
  };
  usage: string[];
  software: string[];
  performance_priority: string[];
  constraints: {
    socket?: string;
    ecc_required?: boolean;
    dual_cpu?: boolean;
    gpu_length_limit?: string;
    psu_limit?: string;
    form_factor?: string;
    storage_slots?: string;
  };
  special_requirements: string[];
}

// --- Comparison Module Types ---
export interface ComparisonItem {
  name: string;
  specs: Record<string, string | number>;
  price: number | string;
  vendor: string;
  phone: string;
  benchmark: string;
  pros: string[];
  cons: string[];
  image?: string; // Merged client-side
}

export interface ComparisonResult {
  comparison_table: {
    category: string;
    items: ComparisonItem[];
  };
  summary: {
    best_performance: string;
    best_value: string;
    best_for_budget: string;
    best_overall: string;
  };
  recommendation: {
    reasoning: string;
    suggested_choice: string;
  };
}

// --- Module 1: Link Display Types ---
export interface OfficialLinks {
  product_page: string;
  spec_page: string;
  support_page: string;
  driver_page: string;
}

export interface RetailLink {
  store: string;
  url: string;
  price: string;
  availability: string;
  phone: string;
}

export interface ComponentLinks {
  official_links: OfficialLinks;
  retail_links: RetailLink[];
}

// --- Module 2: Price Crawler Types ---
export interface PriceCrawlItem {
  store: string;
  url: string;
  price: number; // Numeric for calculation
  displayPrice: string; // Formatted
  availability: string;
  phone: string;
  rating: string;
}

export interface PriceCrawlResult {
  query: string;
  results: PriceCrawlItem[];
  summary: {
    lowest_price: string;
    highest_price: string;
    average_price: string;
  };
}

// --- Module 3: Real-Time Update Types ---
export interface RealTimePriceUpdate {
  component_name: string;
  old_price: number;
  new_price: number;
  price_change: 'increase' | 'decrease' | 'stable';
  best_store: string;
  timestamp: string;
}

// --- NEW MODULES ---

// Module: Vendor Sync
export interface VendorSyncResult {
  vendor_sync: {
    component_name: string;
    official_vendor: {
      name: string;
      product_page: string;
      support_page: string;
      phone: string;
    };
    retail_vendors: {
      store: string;
      url: string;
      price: string;
      availability: string;
      phone: string;
    }[];
  };
}

// Module: Price Drop Alert
export interface PriceDropAlert {
  price_drop_alert: {
    component_name: string;
    old_price: string;
    new_price: string;
    drop_percent: string;
    alert_triggered: boolean;
    timestamp: string;
  };
}

// Module: Price Trend Analysis
export interface PriceTrendAnalysis {
  price_trend_analysis: {
    component_name: string;
    history: { date: string; price: number }[];
    trend: 'up' | 'down' | 'stable';
    volatility: string;
    predicted_price_7d: string;
    predicted_price_30d: string;
    recommendation: string;
  };
}

// --- E-COMMERCE DATA FEED MODULE ---
export interface MarketplaceProduct {
  name: string;
  image: string;
  images?: string[]; // Module 1: Gallery Support
  price: string;
  currency: string;
  description: string;
  rating: string;
  availability: string;
  vendor: string;
  vendor_phone: string;
  product_url: string;
  source: string; // "Amazon" | "Shopee" | "Kakaku" etc.
  specs: {
    brand: string;
    model: string;
    category: string;
    technical_details: { name: string; value: string }[];
  };
}

export interface ProductFeedResult {
  product_feed: MarketplaceProduct[];
}

// --- Module 12: Review AI Analysis ---
export interface ReviewAnalysis {
  review_ai: {
    product_name: string;
    average_rating: string;
    pros: string[];
    cons: string[];
    summary: string;
    recommendation: string;
  };
}

// --- Module 13: Advanced Filter Types ---
export interface SearchFilters {
  priceMin: string;
  priceMax: string;
  brands: string[];
  rating: string;
  inStock: boolean;
  category: string;
}

// --- Module 14: Data Recovery & Fallback ---
export interface DataRecoveryResult {
  data_recovery: {
    product_name: string;
    missing_fields: string[];
    recovered_fields: {
      manufacturer_links: {
         product_page: string;
         support_page: string;
         phone: string;
      };
      images: string[];
      videos: string[];
      specs: { name: string; value: string }[];
    };
    fallback_used: {
      images: boolean;
      videos: boolean;
      specs: boolean;
    };
    confidence_score: string; // e.g. "High", "Medium", "Low"
  };
}

// --- Module 15: Data Fusion ---
export interface DataFusionResult {
  data_fusion: {
    product_name: string;
    merged_data: {
      specs: { name: string; value: string }[];
      images: string[];
      videos: string[];
      prices: { vendor: string; price: string }[];
      vendors: { name: string; url: string; phone: string }[];
    };
    source_map: {
      specs: string;
      images: string;
      videos: string;
      prices: string;
      vendors: string;
    };
  };
}

// --- Module 16: Confidence Scoring ---
export interface ConfidenceScoreResult {
  confidence_score: {
    product_name: string;
    scores: {
      specs: number;
      images: number;
      videos: number;
      prices: number;
      vendors: number;
    };
    overall_score: number;
    label: "high" | "medium" | "low";
    reasoning: string;
  };
}

// --- Module 17: Data Cleaning ---
export interface DataCleaningResult {
  data_cleaning: {
    product_name: string;
    cleaned_data: {
      specs: { name: string; value: string }[];
      images: string[];
      prices: { vendor: string; price: string }[];
      vendors: { name: string; url: string }[];
    };
    removed_items: string[];
    normalization_rules_applied: string[];
  };
}

// --- Module 18: Category Product Listing ---
export interface CategoryListingResult {
  category_page: {
    category_name: string;
    products: MarketplaceProduct[];
    pagination: {
      page: number;
      total_pages: number;
    };
  };
}

// --- Module 19: Media Enrichment ---
export interface MediaEnrichmentResult {
  media_enrichment: {
    product_name: string;
    images: {
      url: string;
      source: 'official' | 'retailer' | 'review';
      quality: 'high' | 'medium' | 'low';
      alt: string;
    }[];
    videos: {
      url: string;
      source: 'official' | 'retailer' | 'review';
      type: 'promo' | 'unboxing' | 'benchmark' | 'review';
      duration: string;
      quality: 'HD' | 'FullHD' | '4K';
    }[];
    fallback_used: {
      images: boolean;
      videos: boolean;
    };
  };
}

// --- Module 20: Hierarchical Product Architect ---
export interface ComponentNode {
  id: string;
  name: string;
  type: 'product' | 'assembly' | 'part'; // Root, Middle Branch, Leaf
  description: string;
  specs: Record<string, string>;
  children: ComponentNode[];
  isExpanded?: boolean; // UI state
}

export interface CompositeContentResult {
  composite_content: {
    title: string;
    marketing_description: string;
    technical_summary: string;
    key_features_from_children: string[];
    completeness_score: number;
  };
}