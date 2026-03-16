-- PokerHub Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    chip_stack INTEGER DEFAULT 10000,
    total_hands INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    total_profit INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tables table
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    max_players INTEGER DEFAULT 6,
    small_blind INTEGER DEFAULT 10,
    big_blind INTEGER DEFAULT 20,
    min_buy_in INTEGER DEFAULT 200,
    max_buy_in INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT true,
    position_x DECIMAL(10,2) DEFAULT 0,
    position_z DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hands table
CREATE TABLE IF NOT EXISTS hands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    hand_number INTEGER NOT NULL,
    player_cards JSONB NOT NULL,
    community_cards JSONB DEFAULT '[]',
    phase VARCHAR(20) DEFAULT 'preflop', -- preflop, flop, turn, river, showdown
    pot_size INTEGER DEFAULT 0,
    winner_id UUID REFERENCES players(id),
    winning_hand VARCHAR(50),
    win_probability DECIMAL(5,2),
    played_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hand_id UUID REFERENCES hands(id),
    player_id UUID REFERENCES players(id),
    action VARCHAR(20) NOT NULL, -- fold, check, call, raise, all-in
    amount INTEGER DEFAULT 0,
    phase VARCHAR(20) NOT NULL,
    pot_odds DECIMAL(5,2),
    expected_value DECIMAL(10,2),
    recommended_action VARCHAR(20),
    followed_recommendation BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cards table (hand cards log)
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hand_id UUID REFERENCES hands(id),
    player_id UUID REFERENCES players(id),
    card_rank VARCHAR(5) NOT NULL,  -- 2-9, T, J, Q, K, A
    card_suit VARCHAR(10) NOT NULL, -- hearts, diamonds, clubs, spades
    card_type VARCHAR(20) NOT NULL, -- hole, flop, turn, river
    dealt_at TIMESTAMP DEFAULT NOW()
);

-- Statistics table (aggregated)
CREATE TABLE IF NOT EXISTS statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) UNIQUE,
    vpip DECIMAL(5,2) DEFAULT 0,           -- Voluntarily Put money In Pot
    pfr DECIMAL(5,2) DEFAULT 0,            -- Pre-Flop Raise
    aggression_factor DECIMAL(5,2) DEFAULT 0,
    hands_per_hour DECIMAL(5,2) DEFAULT 0,
    avg_pot_size DECIMAL(10,2) DEFAULT 0,
    best_hand VARCHAR(50),
    worst_beat VARCHAR(255),
    royal_flush_count INTEGER DEFAULT 0,
    straight_flush_count INTEGER DEFAULT 0,
    four_of_kind_count INTEGER DEFAULT 0,
    full_house_count INTEGER DEFAULT 0,
    flush_count INTEGER DEFAULT 0,
    straight_count INTEGER DEFAULT 0,
    three_of_kind_count INTEGER DEFAULT 0,
    two_pair_count INTEGER DEFAULT 0,
    pair_count INTEGER DEFAULT 0,
    high_card_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    table_id UUID REFERENCES tables(id),
    seat_number INTEGER,
    buy_in INTEGER NOT NULL,
    cash_out INTEGER,
    profit_loss INTEGER,
    hands_played INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hands_table_id ON hands(table_id);
CREATE INDEX IF NOT EXISTS idx_hands_player_cards ON hands USING GIN(player_cards);
CREATE INDEX IF NOT EXISTS idx_bets_hand_id ON bets(hand_id);
CREATE INDEX IF NOT EXISTS idx_bets_player_id ON bets(player_id);
CREATE INDEX IF NOT EXISTS idx_cards_hand_id ON cards(hand_id);
CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON sessions(player_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
