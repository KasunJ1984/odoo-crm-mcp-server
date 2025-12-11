/**
 * Clustering Service - Pattern Discovery
 *
 * Uses K-means clustering to identify patterns in CRM data.
 * Groups similar opportunities to discover common themes.
 */
import { PatternDiscoveryResult } from '../types.js';
/**
 * Cluster embeddings using K-means.
 *
 * @param embeddings - Array of embedding vectors
 * @param numClusters - Number of clusters to create (2-10)
 * @returns Cluster assignments for each embedding
 */
export declare function clusterEmbeddings(embeddings: number[][], numClusters: number): {
    clusters: number[];
    centroids: number[][];
};
/**
 * Discover patterns in CRM data using clustering.
 */
export declare function discoverPatterns(analysisType: 'lost_reasons' | 'winning_factors' | 'deal_segments' | 'objection_themes', filter: {
    is_lost?: boolean;
    is_won?: boolean;
    sector?: string;
    min_revenue?: number;
}, numClusters?: number): Promise<PatternDiscoveryResult>;
//# sourceMappingURL=clustering-service.d.ts.map