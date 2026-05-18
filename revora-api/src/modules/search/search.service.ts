import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  private client: MeiliSearch;
  private readonly logger = new Logger(SearchService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MEILISEARCH_HOST');
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');

    if (host && apiKey) {
      this.client = new MeiliSearch({ host, apiKey });
      this.logger.log('Meilisearch client initialized');
    } else {
      this.logger.warn('Meilisearch credentials missing. Search will be disabled.');
    }
  }

  async indexProduct(product: any) {
    if (!this.client) return;
    try {
      const index = this.client.index('products');
      await index.addDocuments([product]);
    } catch (e) {
      this.logger.error('Failed to index product', e);
    }
  }

  async searchProducts(query: string) {
    if (!this.client) return [];
    try {
      const index = this.client.index('products');
      const search = await index.search(query);
      return search.hits;
    } catch (e) {
      this.logger.error('Failed to search products', e);
      return [];
    }
  }
}
