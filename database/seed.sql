-- Seed data for PokerHub

INSERT INTO tables (name, max_players, small_blind, big_blind, min_buy_in, max_buy_in, position_x, position_z) VALUES
    ('Table Royale', 6, 10, 20, 200, 2000, -8, -8),
    ('High Roller', 6, 50, 100, 1000, 10000, 8, -8),
    ('Beginners Table', 6, 5, 10, 100, 1000, 0, 8),
    ('VIP Lounge', 4, 100, 200, 2000, 20000, -8, 8),
    ('Tournament 1', 9, 25, 50, 500, 5000, 8, 8);

INSERT INTO players (username, email, chip_stack) VALUES
    ('AI_Player_1', 'ai1@pokerhub.com', 5000),
    ('AI_Player_2', 'ai2@pokerhub.com', 8000),
    ('AI_Player_3', 'ai3@pokerhub.com', 3000),
    ('Demo_Player', 'demo@pokerhub.com', 10000);
