-- CREATE DATABASE restaurants_service;
-- \c restaurants_service
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE restaurants (
  restaurant_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews(
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    rating int NOT NULL,
    comment varchar(255) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
