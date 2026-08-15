/**
 * Type declarations for culqi-node package
 */

declare module "culqi-node" {
  interface CulqiConfig {
    privateKey: string;
  }

  interface CulqiCharge {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    list(params?: any): Promise<any>;
  }

  interface CulqiRefund {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
    list(params?: any): Promise<any>;
  }

  interface CulqiToken {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
  }

  interface CulqiCustomer {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<any>;
    list(params?: any): Promise<any>;
  }

  interface CulqiCard {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<any>;
    list(params?: any): Promise<any>;
  }

  interface CulqiPlan {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<any>;
    list(params?: any): Promise<any>;
  }

  interface CulqiSubscription {
    create(data: any): Promise<any>;
    get(id: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<any>;
    list(params?: any): Promise<any>;
  }

  class Culqi {
    constructor(config: CulqiConfig);
    
    charges: CulqiCharge;
    refunds: CulqiRefund;
    tokens: CulqiToken;
    customers: CulqiCustomer;
    cards: CulqiCard;
    plans: CulqiPlan;
    subscriptions: CulqiSubscription;
  }

  export = Culqi;
}
