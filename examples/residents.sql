-- Example: Residents table for a property management system

CREATE TABLE residents (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE NOT NULL,
  move_in_date DATE NOT NULL,
  apartment_number VARCHAR(10) NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true
);
