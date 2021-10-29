declare namespace message {
  export interface message {
    tag: 'appear_hell' | 'start_quest' | 'normal_attack' | 'game_result';
    tab_id?: number;
    quest_type?: 'trial' | 'normal';
    is_win?: boolean;
    is_last_raid?: boolean;
  }
}
