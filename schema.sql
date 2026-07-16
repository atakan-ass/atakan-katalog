CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT,
  category TEXT,
  description TEXT,
  images TEXT,
  features TEXT,
  whatsappMessage TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT,
  message TEXT
);
