import psycopg2

sql_commands = """
-- 1. Enable the spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the Waterbodies table
CREATE TABLE IF NOT EXISTS waterbodies (
    id SERIAL PRIMARY KEY,
    digital_id VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    original_area_acres FLOAT,
    boundary_geom GEOMETRY(Polygon, 4326) -- 4326 is the standard GPS format
);

-- 3. Insert initial data (ignore if already exists)
INSERT INTO waterbodies (digital_id, name, original_area_acres, boundary_geom) VALUES
('TN-LAKE-001', 'Puzhal Lake', 4500, ST_GeomFromText('POLYGON((80.1 13.1, 80.2 13.1, 80.2 13.2, 80.1 13.2, 80.1 13.1))', 4326)),
('TN-LAKE-002', 'Chembarambakkam Lake', 6000, ST_GeomFromText('POLYGON((80.0 12.9, 80.1 12.9, 80.1 13.0, 80.0 13.0, 80.0 12.9))', 4326)),
('TN-LAKE-003', 'Porur Lake', 800, ST_GeomFromText('POLYGON((80.15 13.03, 80.16 13.03, 80.16 13.04, 80.15 13.04, 80.15 13.03))', 4326)),
('TN-LAKE-004', 'Madambakkam Lake', 250, ST_GeomFromText('POLYGON((80.17 12.89, 80.18 12.89, 80.18 12.90, 80.17 12.90, 80.17 12.89))', 4326)),
('TN-LAKE-005', 'Ambattur Lake', 650, ST_GeomFromText('POLYGON((80.14 13.11, 80.15 13.11, 80.15 13.12, 80.14 13.12, 80.14 13.11))', 4326))
ON CONFLICT (digital_id) DO NOTHING;
"""

try:
    conn = psycopg2.connect(user='postgres', password='2801', host='localhost', port='5432', dbname='waterguard')
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql_commands)
    cur.close()
    conn.close()
    print("Successfully added waterbodies and PostGIS extension!")
except Exception as e:
    print(f"Error: {e}")
