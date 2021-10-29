declare namespace parameter {
  export interface filter {
    url: string;
    attribute?: number;
    summon: summon | summon[];
  }
  export interface summon {
    name: string;
    bless_rank: number;
  }
}
