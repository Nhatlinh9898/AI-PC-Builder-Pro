import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  Build, PART_CATEGORY, PC_TYPE, UserRequirementAnalysis, Part, 
  ComparisonResult, ComponentLinks, PriceCrawlResult, RealTimePriceUpdate,
  VendorSyncResult, PriceDropAlert, PriceTrendAnalysis, ProductFeedResult,
  ReviewAnalysis, SearchFilters, MarketplaceProduct, DataRecoveryResult,
  DataFusionResult, ConfidenceScoreResult, DataCleaningResult, CategoryListingResult,
  MediaEnrichmentResult, ComponentNode, CompositeContentResult
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const suggestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: { type: Type.STRING, description: "Explanation of why these parts were chosen." },
    parts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of the part (CPU, GPU, etc)." },
          name: { type: Type.STRING, description: "Name of the recommended part." },
          estimatedPrice: { type: Type.NUMBER, description: "Estimated price in USD." }
        }
      }
    }
  },
  required: ["reasoning", "parts"]
};

// Schema for Requirements Analysis
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    machine_type: { type: Type.STRING, enum: ['office', 'gaming', 'workstation', 'server'] },
    budget: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.STRING }, // Keeping as string to handle "unknown" or ranges easily
        currency: { type: Type.STRING }
      }
    },
    usage: { type: Type.ARRAY, items: { type: Type.STRING } },
    software: { type: Type.ARRAY, items: { type: Type.STRING } },
    performance_priority: { type: Type.ARRAY, items: { type: Type.STRING } },
    constraints: {
      type: Type.OBJECT,
      properties: {
        socket: { type: Type.STRING, nullable: true },
        ecc_required: { type: Type.BOOLEAN, nullable: true },
        dual_cpu: { type: Type.BOOLEAN, nullable: true },
        gpu_length_limit: { type: Type.STRING, nullable: true },
        psu_limit: { type: Type.STRING, nullable: true },
        form_factor: { type: Type.STRING, nullable: true },
        storage_slots: { type: Type.STRING, nullable: true }
      }
    },
    special_requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["machine_type", "budget", "usage", "performance_priority"]
};

// Schema for FULL Auto-Build
const autoBuildSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: Object.values(PC_TYPE) },
    reasoning: { type: Type.STRING, description: "Detailed strategy for this build configuration." },
    parts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: Object.values(PART_CATEGORY) },
          name: { type: Type.STRING },
          brand: { type: Type.STRING },
          price: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          specs: {
            type: Type.OBJECT,
            properties: {
               socket: { type: Type.STRING, nullable: true },
               chipset: { type: Type.STRING, nullable: true },
               memoryType: { type: Type.STRING, nullable: true },
               wattage: { type: Type.NUMBER, nullable: true },
               capacity: { type: Type.STRING, nullable: true },
               vram: { type: Type.STRING, nullable: true },
               formFactor: { type: Type.STRING, nullable: true },
               speed: { type: Type.STRING, nullable: true }
            },
            nullable: true
          }
        },
        required: ["category", "name", "price"]
      }
    }
  },
  required: ["type", "reasoning", "parts"]
};

// Schema for Alternatives
const alternativesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          brand: { type: Type.STRING },
          price: { type: Type.NUMBER },
          specs: {
            type: Type.OBJECT,
            properties: {
               socket: { type: Type.STRING, nullable: true },
               speed: { type: Type.STRING, nullable: true },
               capacity: { type: Type.STRING, nullable: true },
               wattage: { type: Type.NUMBER, nullable: true },
               // Generic catch-all for comparison
               benchmarkScore: { type: Type.STRING, nullable: true, description: "e.g. Cinebench R23, TimeSpy" },
            },
            nullable: true
          },
          vendor: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              url: { type: Type.STRING },
              phone: { type: Type.STRING, description: "Customer support phone number for this vendor if known" }
            }
          }
        },
        required: ["name", "price"]
      }
    }
  }
};

// --- Module 4: Comparison Schema ---
const comparisonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    comparison_table: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              specs: { 
                  type: Type.OBJECT, 
                  description: "Key-value pairs of relevant specs (e.g., Cores: 16, VRAM: 24GB)" 
              },
              price: { type: Type.STRING, description: "Current market price or 'Unknown'" },
              vendor: { type: Type.STRING },
              phone: { type: Type.STRING, description: "Vendor contact number or 'N/A'" },
              benchmark: { type: Type.STRING, description: "Relevant benchmark score (e.g. Cinebench: 30000)" },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      },
      required: ["category", "items"]
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        best_performance: { type: Type.STRING },
        best_value: { type: Type.STRING },
        best_for_budget: { type: Type.STRING },
        best_overall: { type: Type.STRING }
      }
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        reasoning: { type: Type.STRING },
        suggested_choice: { type: Type.STRING }
      }
    }
  }
};

// --- Module 1 & 5: Component Links Schema ---
const componentLinksSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    official_links: {
      type: Type.OBJECT,
      properties: {
        product_page: { type: Type.STRING },
        spec_page: { type: Type.STRING },
        support_page: { type: Type.STRING },
        driver_page: { type: Type.STRING }
      },
      required: ["product_page", "spec_page"]
    },
    retail_links: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          store: { type: Type.STRING },
          url: { type: Type.STRING },
          price: { type: Type.STRING },
          availability: { type: Type.STRING, description: "e.g. In Stock, Pre-order, Out of Stock" },
          phone: { type: Type.STRING, description: "Customer Service Phone" }
        },
        required: ["store", "url"]
      }
    }
  },
  required: ["official_links", "retail_links"]
};

// --- Module 2: Price Crawler Schema ---
const priceCrawlerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    query: { type: Type.STRING },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          store: { type: Type.STRING },
          url: { type: Type.STRING },
          price: { type: Type.NUMBER },
          displayPrice: { type: Type.STRING },
          availability: { type: Type.STRING },
          phone: { type: Type.STRING },
          rating: { type: Type.STRING }
        },
        required: ["store", "price", "displayPrice"]
      }
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        lowest_price: { type: Type.STRING },
        highest_price: { type: Type.STRING },
        average_price: { type: Type.STRING }
      }
    }
  },
  required: ["results", "summary"]
};

// --- Module 3: Real Time Update Schema ---
const priceUpdateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    component_name: { type: Type.STRING },
    old_price: { type: Type.NUMBER },
    new_price: { type: Type.NUMBER },
    price_change: { type: Type.STRING, enum: ['increase', 'decrease', 'stable'] },
    best_store: { type: Type.STRING },
    timestamp: { type: Type.STRING }
  },
  required: ["old_price", "new_price", "price_change"]
};

// --- Module 8: Vendor Sync Schema ---
const vendorSyncSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vendor_sync: {
      type: Type.OBJECT,
      properties: {
        component_name: { type: Type.STRING },
        official_vendor: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            product_page: { type: Type.STRING },
            support_page: { type: Type.STRING },
            phone: { type: Type.STRING }
          }
        },
        retail_vendors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING },
              url: { type: Type.STRING },
              price: { type: Type.STRING },
              availability: { type: Type.STRING },
              phone: { type: Type.STRING }
            }
          }
        }
      }
    }
  }
};

// --- Module 9: Price Drop Alert Schema ---
const priceAlertSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    price_drop_alert: {
      type: Type.OBJECT,
      properties: {
        component_name: { type: Type.STRING },
        old_price: { type: Type.STRING },
        new_price: { type: Type.STRING },
        drop_percent: { type: Type.STRING },
        alert_triggered: { type: Type.BOOLEAN },
        timestamp: { type: Type.STRING }
      }
    }
  }
};

// --- Module 10: Price Trend Analysis Schema ---
const trendAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    price_trend_analysis: {
      type: Type.OBJECT,
      properties: {
        component_name: { type: Type.STRING },
        history: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              price: { type: Type.NUMBER }
            }
          }
        },
        trend: { type: Type.STRING, enum: ['up', 'down', 'stable'] },
        volatility: { type: Type.STRING },
        predicted_price_7d: { type: Type.STRING },
        predicted_price_30d: { type: Type.STRING },
        recommendation: { type: Type.STRING }
      }
    }
  }
};

// --- E-Commerce Data Feed Schema ---
const productFeedSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    product_feed: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          image: { type: Type.STRING, description: "URL to product image if found, else placeholder" },
          images: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Additional images for gallery" },
          price: { type: Type.STRING, description: "Set to 'Unknown' if uncertain" },
          currency: { type: Type.STRING },
          description: { type: Type.STRING },
          rating: { type: Type.STRING },
          availability: { type: Type.STRING, description: "e.g. 'In Stock', 'Out of Stock', 'Check Store'" },
          vendor: { type: Type.STRING, description: "Name of the retailer. If found on multiple, use 'Aggregated Retailers'." },
          vendor_phone: { type: Type.STRING },
          product_url: { type: Type.STRING, description: "Link to buy. Empty if unavailable." },
          source: { type: Type.STRING },
          specs: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              model: { type: Type.STRING },
              category: { type: Type.STRING },
              technical_details: { 
                type: Type.ARRAY,
                description: "List of key-value pairs for technical specifications",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["name", "value"]
                }
              }
            },
            required: ["brand", "technical_details"]
          }
        },
        required: ["name", "price", "vendor", "specs"]
      }
    }
  },
  required: ["product_feed"]
};

// --- Review Analysis Schema ---
const reviewAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    review_ai: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        average_rating: { type: Type.STRING },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING },
        recommendation: { type: Type.STRING }
      }
    }
  }
};

// --- Module 14: Data Recovery Schema ---
const recoverySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    data_recovery: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        missing_fields: { type: Type.ARRAY, items: { type: Type.STRING } },
        recovered_fields: {
          type: Type.OBJECT,
          properties: {
            manufacturer_links: {
              type: Type.OBJECT,
              properties: {
                product_page: { type: Type.STRING },
                support_page: { type: Type.STRING },
                phone: { type: Type.STRING }
              }
            },
            images: { type: Type.ARRAY, items: { type: Type.STRING } },
            videos: { type: Type.ARRAY, items: { type: Type.STRING } },
            specs: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            }
          }
        },
        fallback_used: {
          type: Type.OBJECT,
          properties: {
            images: { type: Type.BOOLEAN },
            videos: { type: Type.BOOLEAN },
            specs: { type: Type.BOOLEAN }
          }
        },
        confidence_score: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
      }
    }
  }
};

// --- Module 15: Data Fusion Schema ---
const fusionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    data_fusion: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        merged_data: {
          type: Type.OBJECT,
          properties: {
            specs: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, value: { type: Type.STRING } }
              } 
            },
            images: { type: Type.ARRAY, items: { type: Type.STRING } },
            videos: { type: Type.ARRAY, items: { type: Type.STRING } },
            prices: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: { vendor: { type: Type.STRING }, price: { type: Type.STRING } }
              } 
            },
            vendors: { 
              type: Type.ARRAY, 
              items: { 
                 type: Type.OBJECT,
                 properties: { name: { type: Type.STRING }, url: { type: Type.STRING }, phone: { type: Type.STRING } }
              } 
            }
          }
        },
        source_map: {
          type: Type.OBJECT,
          properties: {
            specs: { type: Type.STRING },
            images: { type: Type.STRING },
            videos: { type: Type.STRING },
            prices: { type: Type.STRING },
            vendors: { type: Type.STRING }
          }
        }
      }
    }
  }
};

// --- Module 16: Confidence Score Schema ---
const confidenceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    confidence_score: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        scores: {
          type: Type.OBJECT,
          properties: {
            specs: { type: Type.NUMBER },
            images: { type: Type.NUMBER },
            videos: { type: Type.NUMBER },
            prices: { type: Type.NUMBER },
            vendors: { type: Type.NUMBER }
          }
        },
        overall_score: { type: Type.NUMBER },
        label: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        reasoning: { type: Type.STRING }
      }
    }
  }
};

// --- Module 17: Data Cleaning Schema ---
const cleaningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    data_cleaning: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        cleaned_data: {
          type: Type.OBJECT,
          properties: {
             specs: { 
               type: Type.ARRAY, 
               items: { 
                 type: Type.OBJECT, 
                 properties: { name: { type: Type.STRING }, value: { type: Type.STRING } }
               } 
             },
             images: { type: Type.ARRAY, items: { type: Type.STRING } },
             prices: { 
               type: Type.ARRAY, 
               items: { 
                 type: Type.OBJECT,
                 properties: { vendor: { type: Type.STRING }, price: { type: Type.STRING } }
               } 
             },
             vendors: { 
               type: Type.ARRAY, 
               items: { 
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, url: { type: Type.STRING } }
               } 
             }
          }
        },
        removed_items: { type: Type.ARRAY, items: { type: Type.STRING } },
        normalization_rules_applied: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    }
  }
};

// --- Module 18: Category Page Schema ---
const categoryPageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category_page: {
      type: Type.OBJECT,
      properties: {
        category_name: { type: Type.STRING },
        products: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                name: { type: Type.STRING },
                image: { type: Type.STRING },
                price: { type: Type.STRING, description: "Set to 'Unknown' if uncertain" },
                currency: { type: Type.STRING },
                rating: { type: Type.STRING },
                description: { type: Type.STRING },
                vendor: { type: Type.STRING, description: "Name of the retailer. If multiple, use 'Aggregated Retailers'." },
                vendor_phone: { type: Type.STRING },
                product_url: { type: Type.STRING, description: "Buy link. Empty if unavailable." },
                source: { type: Type.STRING },
                availability: { type: Type.STRING },
                specs: {
                    type: Type.OBJECT,
                    properties: {
                        brand: { type: Type.STRING },
                        model: { type: Type.STRING },
                        category: { type: Type.STRING },
                        technical_details: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { name: {type:Type.STRING}, value: {type:Type.STRING} } 
                            } 
                        }
                    }
                }
             }
          }
        },
        pagination: {
          type: Type.OBJECT,
          properties: {
            page: { type: Type.NUMBER },
            total_pages: { type: Type.NUMBER }
          }
        }
      }
    }
  }
};

// --- Module 19: Media Enrichment Schema ---
const mediaEnrichmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    media_enrichment: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        images: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              source: { type: Type.STRING, enum: ['official', 'retailer', 'review'] },
              quality: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              alt: { type: Type.STRING }
            }
          }
        },
        videos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              source: { type: Type.STRING, enum: ['official', 'retailer', 'review'] },
              type: { type: Type.STRING, enum: ['promo', 'unboxing', 'benchmark', 'review'] },
              duration: { type: Type.STRING },
              quality: { type: Type.STRING, enum: ['HD', 'FullHD', '4K'] }
            }
          }
        },
        fallback_used: {
          type: Type.OBJECT,
          properties: {
            images: { type: Type.BOOLEAN },
            videos: { type: Type.BOOLEAN }
          }
        }
      }
    }
  }
};

// --- Module 20: Composite Content Schema ---
const compositeContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    composite_content: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        marketing_description: { type: Type.STRING },
        technical_summary: { type: Type.STRING },
        key_features_from_children: { type: Type.ARRAY, items: { type: Type.STRING } },
        completeness_score: { type: Type.NUMBER }
      }
    }
  }
};

export const getBuildSuggestion = async (
  budget: number,
  type: string,
  requirements: string
) => {
  try {
    const prompt = `
      I want to build a ${type} PC.
      My budget is roughly $${budget}.
      Specific requirements: ${requirements}.
      Suggest a list of compatible components (CPU, GPU, RAM, Mainboard, Storage, PSU, Case).
      Ensure the build is balanced and components are compatible.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: suggestionSchema,
        systemInstruction: "You are an expert PC builder. Provide JSON output only."
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    throw error;
  }
};

/**
 * MODULE 1: User Requirement Analysis
 */
export const analyzeUserRequest = async (userPrompt: string): Promise<UserRequirementAnalysis> => {
  try {
    const prompt = `
      Analyze this user request: "${userPrompt}"
      
      Extract the following:
      1. Machine Type (office, gaming, workstation, server)
      2. Budget (amount and currency, estimate if missing)
      3. Usage scenarios (e.g. 4K Gaming, AI Training)
      4. Software likely to be used
      5. Performance Priorities (e.g. GPU, Silence)
      6. Technical Constraints (Form factor, ECC, etc.)
      
      If information is vague, infer reasonable defaults based on the context.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        systemInstruction: "You are a Requirements Analyst for a PC building service. You parse fuzzy human language into strict technical JSON specifications."
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * MODULE 2: Build Generator
 */
export const generateCompleteBuild = async (userPrompt: string) => {
    // Legacy support for direct calls
    const analysis = await analyzeUserRequest(userPrompt);
    return generateBuildFromAnalysis(analysis);
}

export const generateBuildFromAnalysis = async (analysis: UserRequirementAnalysis) => {
    try {
        const contextStr = JSON.stringify(analysis, null, 2);
        const prompt = `
            Act as a world-class PC Architect.
            Based on this TECHNICAL ANALYSIS of the user's needs:
            ${contextStr}

            1. Construct a complete PC part list perfectly matched to these constraints.
            2. Select SPECIFIC, REAL-WORLD parts.
            3. Ensure Socket compatibility, PSU wattage sufficiency, and Case clearance.
            4. Optimize for the stated "performance_priority".
            5. Return a complete configuration list.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: autoBuildSchema,
                systemInstruction: "You are a specialized PC Hardware AI. You construct complete, compatible PC builds from structured technical specs."
            }
        });

        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Auto Build Error:", error);
        throw error;
    }
};

/**
 * MODULE 3: Comparison & Alternatives
 * Fetches 5 alternatives for a specific part.
 */
export const getPartAlternatives = async (part: Part, buildType: string) => {
  try {
    const prompt = `
      For the PC Component: "${part.name}" (${part.category}), which is being used in a "${buildType}" build.
      
      Provide exactly 5 excellent ALTERNATIVE choices that are compatible or competitive.
      Include a mix of:
      - Better performance (Higher Price)
      - Better value (Lower Price)
      - Direct Competitor (Same Price)
      
      For each alternative, include:
      - Real-world price
      - Key specs
      - A major vendor name, link, and their customer service phone number if known.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: alternativesSchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data.alternatives || [];
  } catch (error) {
    console.error("Alternatives Error", error);
    return [];
  }
};

/**
 * MODULE 4: Detailed Component Comparison
 * Generates a full comparison table for selected parts.
 */
export const generateDetailedComparison = async (parts: Part[]): Promise<ComparisonResult | null> => {
    try {
        const partsInfo = parts.map(p => ({
            name: p.name,
            brand: p.brand,
            price: p.price,
            specs: p.specs
        }));
        
        const contextStr = JSON.stringify(partsInfo, null, 2);
        
        const prompt = `
            Analyze and compare these specific PC components:
            ${contextStr}

            1. Normalize their specifications for a direct column-by-column comparison.
            2. Identify specific Pros and Cons for each based on current market standards.
            3. Determine the best choice for Performance, Value, and Budget.
            4. Provide relevant Benchmark scores (e.g. Cinebench, 3DMark, R/W Speeds) if applicable to the category.
            5. Find a representative Vendor and Customer Support Phone Number for each.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: comparisonSchema,
                systemInstruction: "You are a Tech Reviewer. You provide objective, data-driven comparisons of PC hardware."
            }
        });

        const data = JSON.parse(response.text || "{}") as ComparisonResult;
        
        // Merge client-side image data back into the AI result to ensure we display valid images
        if (data.comparison_table && data.comparison_table.items) {
            data.comparison_table.items = data.comparison_table.items.map((item, index) => {
                // Try to match by name or index. 
                // Since AI might slightly alter names, index matching is often safer if the list order is preserved.
                // However, let's try to match loosely by name first.
                const originalPart = parts.find(p => p.name.includes(item.name) || item.name.includes(p.name)) || parts[index];
                return {
                    ...item,
                    image: originalPart ? originalPart.image : ''
                };
            });
        }

        return data;

    } catch (error) {
        console.error("Comparison Error:", error);
        return null;
    }
};

/**
 * MODULE 5: Manufacturer & Retailer Links
 */
export const getComponentLinks = async (partName: string): Promise<ComponentLinks | null> => {
  try {
    const prompt = `
      For the PC Component: "${partName}".
      
      Generate a list of Official Manufacturer Links and Retailer Links.
      
      1. Official Links: Product page, Specs, Support, Drivers (e.g. Intel ARK, AMD Drivers, ASUS Support).
      2. Retailer Links: Amazon, Newegg, Shopee, B&H, etc.
      
      If exact URLs are not found, generate the most likely search URL or 'unknown'.
      Include customer service phone numbers for retailers if known.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: componentLinksSchema,
        tools: [{ googleSearch: {} }] // Use search to find real links
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Component Links Error:", error);
    return null;
  }
};

/**
 * MODULE 6: Price Crawler (Simulated with Gemini)
 */
export const crawlComponentPrices = async (partName: string): Promise<PriceCrawlResult | null> => {
  try {
    const prompt = `
      Perform a price check for: "${partName}".
      
      Search major retailers (Amazon, Shopee, Lazada, Newegg, Kakaku, Akiba PC Hotline, Rakuten).
      Extract the current price, availability, and vendor rating.
      Calculate lowest, highest, and average price.
      Return the data in the specified JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: priceCrawlerSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Price Crawler Error:", error);
    return null;
  }
};

/**
 * MODULE 7: Real-Time Price Update Logic
 */
export const checkPriceUpdate = async (partName: string, oldPrice: number): Promise<RealTimePriceUpdate | null> => {
  try {
    const prompt = `
      Compare the current live market price of "${partName}" against its recorded old price of ${oldPrice}.
      
      Determine if the price has increased, decreased, or remained stable.
      Find the store offering the best current price.
      Return a JSON summary including the new price and timestamp.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: priceUpdateSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Price Update Error:", error);
    return null;
  }
};

/**
 * MODULE 8: Vendor Sync (New)
 */
export const syncVendorData = async (partName: string): Promise<VendorSyncResult | null> => {
  try {
    const prompt = `
      Sync vendor data for: "${partName}".
      
      1. Find the Official Manufacturer details (Official Site, Support Page, Phone).
      2. Find distinct Major Retailers selling this item (Amazon, Shopee, etc.).
      3. Standardize pricing, stock status, and contact info.
      4. Merge data and remove duplicates.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: vendorSyncSchema,
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Vendor Sync Error:", error);
    return null;
  }
};

/**
 * MODULE 9: Price Drop Alert (New)
 */
export const checkPriceDrop = async (partName: string, oldPrice: number, thresholdPercent: number = 5): Promise<PriceDropAlert | null> => {
  try {
    const prompt = `
      Check for price drops on "${partName}".
      Old recorded price: ${oldPrice}.
      Alert Threshold: ${thresholdPercent}%.
      
      Find the current lowest market price.
      If current price is lower than old price by more than ${thresholdPercent}%, set alert_triggered to true.
      Return the comparison details.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: priceAlertSchema,
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Price Alert Error:", error);
    return null;
  }
};

/**
 * MODULE 10: Price Trend Analysis (New)
 */
export const analyzePriceTrend = async (partName: string): Promise<PriceTrendAnalysis | null> => {
  try {
    const prompt = `
      Analyze the price trend for "${partName}".
      
      1. Estimate price history for the last 6 months based on market knowledge.
      2. Determine the current trend (Up, Down, Stable).
      3. Predict prices for the next 7 and 30 days.
      4. Provide a recommendation (Buy Now, Wait, etc.).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: trendAnalysisSchema,
        // Using tools to get recent price context if needed, though trend is often knowledge-based
        tools: [{ googleSearch: {} }] 
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Trend Analysis Error:", error);
    return null;
  }
};

/**
 * MODULE 11: E-Commerce Product Feed with Advanced Search (Enhanced)
 */
export const generateProductFeed = async (query: string, filters?: SearchFilters): Promise<ProductFeedResult | null> => {
  try {
    let prompt = `
      Search for real-world products matching the query: "${query}".
      Sources: Amazon, Newegg, B&H, BestBuy, Kakaku, Rakuten, Shopee, Lazada.
    `;

    if (filters) {
      prompt += `
      Apply these filters strictly:
      - Price Range: ${filters.priceMin || 'Any'} to ${filters.priceMax || 'Any'}
      - Brands: ${filters.brands.join(', ') || 'Any'}
      - Min Rating: ${filters.rating || 'Any'}
      - Category: ${filters.category || 'Any'}
      - Must be in stock: ${filters.inStock}
      `;
    }

    prompt += `
      Extract: Name, High-quality Image URL, Price, Vendor, Availability, Rating, Description.
      Try to find multiple distinct image URLs if possible (front, back, side) and put them in the 'images' array.
      Normalize data into a consistent product feed.
      
      CRITICAL DATA FUSION & FALLBACK RULES:
      1. If price is missing or uncertain, set "price" to "Unknown" (do not fake a number).
      2. If product is found on multiple sites with similar prices, set "vendor" to "Aggregated Retailers".
      3. If image is missing, try to find a valid URL. If unavailable, leave empty (UI will handle fallback).
      4. If buy link is unavailable, leave "product_url" empty.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: productFeedSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Product Feed Error:", error);
    return null;
  }
};

/**
 * MODULE 12: Review AI Analysis (New)
 */
export const analyzeProductReviews = async (productName: string): Promise<ReviewAnalysis | null> => {
  try {
    const prompt = `
      Analyze reviews for: "${productName}".
      
      1. Gather reviews from Amazon, Reddit, Tech sites (Tom's Hardware, etc.), and YouTube comments.
      2. Summarize the sentiment.
      3. List specific Pros and Cons.
      4. Calculate an average rating based on sentiment if explicit rating is missing.
      5. Provide a final recommendation (Who is this for?).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: reviewAnalysisSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Review Analysis Error:", error);
    return null;
  }
};

/**
 * MODULE 14: Data Recovery & Fallback
 */
export const recoverProductData = async (product: Partial<MarketplaceProduct>): Promise<DataRecoveryResult | null> => {
  try {
    // We send a lightweight summary of what we have to save tokens
    const productSummary = {
        name: product.name,
        missing_images: !product.image || product.image.includes('placehold.co'),
        missing_specs: !product.specs || product.specs.technical_details.length === 0,
        missing_vendor: !product.vendor_phone
    };

    const prompt = `
      The following product data is potentially incomplete: ${JSON.stringify(productSummary)}.
      
      1. Check for missing official Manufacturer Links (Product Page, Support).
      2. If images are missing/low-quality, find better high-res image URLs.
      3. If specs are missing, fill in key technical details (Socket, TDP, Dimensions, etc.).
      4. If official video/reviews are missing, find YouTube links.
      5. Generate a 'Confidence Score' for the data quality.
      
      If data cannot be found, use smart fallbacks or set 'fallback_used' to true.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: recoverySchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Data Recovery Error:", error);
    return null;
  }
};

/**
 * MODULE 15: Data Fusion (Data Fusion AI)
 */
export const fuseProductData = async (productName: string): Promise<DataFusionResult | null> => {
  try {
    const prompt = `
      Perform Data Fusion for product: "${productName}".
      
      1. Simulate retrieving data from multiple disparate sources (e.g. Manufacturer Official Site, Amazon, Shopee, Newegg).
      2. Identify duplicates and conflicting information (e.g. different prices, slightly different spec names).
      3. MERGE them into a single, unified "Golden Record".
      4. Priority Rules: Official Specs > Reputable Retailer Specs > General Retailer.
      5. Map where each piece of data came from (Source Map).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: fusionSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Data Fusion Error:", error);
    return null;
  }
};

/**
 * MODULE 16: Confidence Scoring (Data Confidence Scoring)
 */
export const scoreDataConfidence = async (productName: string): Promise<ConfidenceScoreResult | null> => {
  try {
    const prompt = `
      Evaluate Data Confidence for: "${productName}".
      
      Assess the reliability of available data on the web for this product.
      1. Score consistency of specs across sources (0-100).
      2. Score image quality and availability.
      3. Score price consistency (is it stable or wild?).
      4. Calculate an Overall Confidence Score.
      5. Assign a label: High, Medium, or Low confidence.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: confidenceSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Confidence Scoring Error:", error);
    return null;
  }
};

/**
 * MODULE 17: Data Cleaning (Data Cleaning AI)
 */
export const cleanProductData = async (productName: string): Promise<DataCleaningResult | null> => {
  try {
    const prompt = `
      Perform Data Cleaning for: "${productName}".
      
      1. Find raw data for this product.
      2. Clean text: Fix typos, remove garbage characters, normalize brand names (e.g. "ASUS/Asus" -> "ASUS").
      3. Normalize Units: Convert all storage to GB/TB, speeds to MHz, etc.
      4. Remove invalid data (e.g. $0 price, broken links).
      5. List exactly what was removed or normalized.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: cleaningSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Data Cleaning Error:", error);
    return null;
  }
};

/**
 * MODULE 18: Category Product Listing
 */
export const getCategoryProducts = async (
  category: string,
  page: number = 1,
  filters?: SearchFilters
): Promise<CategoryListingResult | null> => {
  try {
    let prompt = `
      Generate a product listing page for the category: "${category}".
      Page number: ${page}.
      
      1. List top 12 popular/trending products in this category currently available on the market.
      2. Ensure a mix of brands (e.g. for GPU: NVIDIA, AMD, Intel).
      3. Simulate fetching real-time data: Price, Rating, Vendor, Stock.
      4. Automatically fuse, clean, and score confidence for the data before returning.
      
      DATA HANDLING RULES:
      - If price is uncertain, set 'price' to 'Unknown'.
      - If data is merged from multiple sources, set 'vendor' to 'Aggregated Retailers'.
      - Do not hallucinate buy links. Leave 'product_url' empty if not found.
    `;

    if (filters) {
      prompt += `
      Apply Filters:
      - Price: ${filters.priceMin} - ${filters.priceMax}
      - Brands: ${filters.brands.join(', ')}
      - Min Rating: ${filters.rating}
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: categoryPageSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Category Listing Error:", error);
    return null;
  }
};

/**
 * MODULE 19: Auto Image & Video Enrichment
 */
export const enrichProductMedia = async (productName: string): Promise<MediaEnrichmentResult | null> => {
  try {
    const prompt = `
      **MODULE: AUTO IMAGE & VIDEO ENRICHMENT**
      Target Product: "${productName}"

      **MISSION:**
      Automatically discover and attach high-quality media (images & videos) from official sources and reputable retailers.
      
      **PRIORITY SOURCES:**
      1. Official Vendor: Intel, AMD, NVIDIA, ASUS, MSI, Gigabyte, Samsung, etc. (Look for product pages).
      2. Major Retailers: Amazon, Newegg, B&H, BestBuy (Look for high-res product shots).
      3. Review/Community: YouTube (Unboxing/Benchmarks), TechPowerUp, Tom's Hardware.

      **REQUIREMENTS:**
      - **Images:** Prioritize clean, white-background images for the main view. Include lifestyle shots if available.
      - **Videos:** Find official promos, unboxing videos, or trusted reviews (e.g., Linus Tech Tips, Hardware Unboxed).
      - **Labels:** Correctly label source ('official', 'retailer', 'review') and quality.
      - **Accuracy:** Ensure media matches the EXACT model name.

      **OUTPUT:**
      Return a standardized JSON object.
      If specific media is missing, set 'fallback_used' to true.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mediaEnrichmentSchema,
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Media Enrichment Error:", error);
    return null;
  }
};

/**
 * MODULE 20: Hierarchical Content Generation
 */
export const generateCompositeContent = async (node: ComponentNode): Promise<CompositeContentResult | null> => {
  try {
    // Strip UI fields like 'isExpanded' to save tokens and avoid confusion
    const cleanNode = (n: ComponentNode): any => ({
      name: n.name,
      type: n.type,
      description: n.description,
      specs: n.specs,
      children: n.children.map(cleanNode)
    });

    const hierarchyJson = JSON.stringify(cleanNode(node), null, 2);

    const prompt = `
      **MODULE: HIERARCHICAL PRODUCT CONTENT GENERATOR**
      
      **TASK:**
      Generate a comprehensive description and technical summary for a "Parent Product" by analyzing its hierarchical tree of components.
      
      **INPUT HIERARCHY:**
      ${hierarchyJson}
      
      **INSTRUCTIONS:**
      1. **Analyze Bottom-Up:** Look at the 'leaf' nodes (parts) to understand the specific capabilities (e.g., if children are "RTX 4090" and "i9-14900K", the parent "Gaming PC" is "Top-Tier High Performance").
      2. **Synthesize:** Write a 'Marketing Description' that highlights the aggregated value of the sub-components.
      3. **Summarize Specs:** Create a 'Technical Summary' that abstracts the low-level details into high-level specs (e.g., "128GB Total RAM" instead of listing 4x32GB sticks individually).
      4. **Key Features:** Extract 3-5 key selling points derived directly from the child components.
      5. **Score:** Estimate completeness (0-100) based on how many branches have defined children.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: compositeContentSchema
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Composite Content Error:", error);
    return null;
  }
};

export const checkAdvancedCompatibility = async (build: Build) => {
    const partsList = Object.values(build.parts).map(p => `${p.category}: ${p.name}`).join(', ');
    
    const prompt = `
      Check the compatibility of this PC build:
      ${partsList}
      Type: ${build.type}

      Are there any bottlenecks, physical dimension issues (clearance), or power issues?
      Provide a concise summary.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
};

export const compareParts = async (partNames: string[]) => {
  const prompt = `
    Compare the following PC parts concisely in a table format (Markdown):
    ${partNames.join(', ')}
    Focus on performance, value, and key specs.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};

export const findPartDeals = async (partName: string) => {
  const prompt = `
    Find current pricing and availability for "${partName}" on major sites like Amazon, eBay, Newegg, AliExpress, and Alibaba.
    List the findings with prices if available.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const grounding = response.candidates?.[0]?.groundingMetadata;
  
  return {
    text: response.text,
    grounding: grounding
  };
};