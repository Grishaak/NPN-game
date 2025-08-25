export const CONFIG = {
  WIDTH: 1500,
  HEIGHT: 900,
  BACKGROUND_COLOR: '#93a15dff'
};

export const MONSTER = {
  START_X: 150,         
  BASE_SPEED: 120,        
  KNOCKBACK_PIXELS: 240, 
  LUNGE_PIXELS: 200,     
  JUMP_HEIGHT: 90,      
  CATCH_MARGIN: 90,       
  DELTA: 4
};

export const SCORE = {
  QTE_SUCCESS: 50,
  PASSIVE_MIN: 1,
  PASSIVE_MAX: 2
};

export const QTE = {
  ARROW_KEYS: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],

  ARROW_GLYPH: {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→'
  },
  SEQ_MIN_LEN: 3,
  SEQ_MAX_LEN: 5,
  SEQ_TIME_PER_KEY: 650,  
  NEXT_QTE_DELAY: 1400     
};

export const BG = {
  SPEED_L3: 4,
  SPEED_L2: 40,
  SPEED_L1: 200,
  SPEED_L0: 350
};

export const QTE_BAR = {
  QTE_BAR_WIDTH: 420,
  QTE_BAR_HEIGHT: 18,
}

export const ATTACK = {
  TRIGGER_GAP: 150,       
  SEQ_LEN: 8,            
  TIME_PER_KEY: 630,      
  NEXT_DELAY: 800,        
  STRONG_KNOCKBACK: 500,  
  CHEER_MS: 2000          
};

export const DIFF = {
  INTERVAL_SEC: 20,          
  RAMP_MS: 600,             

  MONSTER_SPEED_PER_LVL: 1.04,     
  BG_SPEED_PER_LVL: 1.05,          
  QTE_TIME_PER_KEY_FACTOR: 0.97,   
  SUPER_TIME_PER_KEY_FACTOR: 0.97, 
  QTE_NEXT_DELAY_FACTOR: 0.97,     
  POINTS_PER_QTE_BASE: 50,         
  POINTS_PER_QTE_STEP: 25,         
  LIMITS: {
    QTE_TIME_MIN_MS: 280,         
    SUPER_TIME_MIN_MS: 320,        
    QTE_NEXT_DELAY_MIN_MS: 120    
  }
}