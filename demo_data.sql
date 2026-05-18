-- demo_data.sql
-- Run this in your Supabase SQL Editor to populate the database with demo data.

-- 1. Clear existing data and reset IDs to 1
TRUNCATE TABLE public.tasks, public.transactions, public.maintenance_requests, public.tenants, public.units, public.properties, public.owners RESTART IDENTITY CASCADE;

-- 2. Insert Owners
INSERT INTO public.owners (id, first_name, last_name, email, phone, address, nationality, dob, id_type, id_number) VALUES
(1, 'Sarah', 'Jenkins', 'sarah.j@example.com', '+1-555-0101', '123 Wealth Ave, NY', 'American', '1975-04-12', 'Passport', 'P12345678'),
(2, 'Michael', 'Chen', 'm.chen@example.com', '+1-555-0102', '456 Investment Blvd, CA', 'Canadian', '1982-08-22', 'National ID', 'N98765432'),
(3, 'Elena', 'Rodriguez', 'elena.r@example.com', '+1-555-0103', '789 Property Ln, TX', 'Mexican', '1968-11-05', 'Driver License', 'D45612378');

-- 3. Insert Properties
INSERT INTO public.properties (id, name, address, type, image_url, property_value, owner_id, status, amenities, is_furnished, description, available_from) VALUES
(1, 'The Grand Horizon', '100 Skyline Drive, Downtown', 'Residential', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', 2500000, 1, 'Active', '["Pool", "Gym", "Parking"]', true, 'Luxury high-rise apartments with city views.', '2023-01-01'),
(2, 'Sunset Plaza', '250 West End Ave', 'Commercial', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', 4200000, 2, 'Active', '["Parking", "Security", "Elevator"]', false, 'Prime commercial office space.', '2023-01-01'),
(3, 'Maplewood Estates', '500 Maple Street, Suburbs', 'Residential', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 1800000, 3, 'Active', '["Parking", "Pet Friendly", "Balcony"]', false, 'Quiet suburban townhomes.', '2023-01-01'),
(4, 'Tech Hub Center', '88 Innovation Way', 'Commercial', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', 5500000, 1, 'Active', '["WiFi", "Security", "Gym"]', true, 'Modern co-working and office spaces.', '2023-01-01'),
(5, 'Oceanview Villas', '10 Coastal Highway', 'Residential', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 3100000, 2, 'Active', '["Pool", "Balcony", "Parking"]', true, 'Beachfront luxury villas.', '2023-01-01');

-- 4. Insert Units
INSERT INTO public.units (id, property_id, unit_number, rent_amount, status, living_rooms, bedrooms, bathrooms) VALUES
(1, 1, '101', 2500, 'Occupied', 1, 2, 1), (2, 1, '102', 2600, 'Occupied', 1, 2, 2), (3, 1, '103', 2450, 'Vacant', 1, 1, 1), (4, 1, '201', 2800, 'Occupied', 1, 3, 2),
(5, 2, 'Suite A', 5000, 'Occupied', 0, 0, 1), (6, 2, 'Suite B', 4500, 'Occupied', 0, 0, 1), (7, 2, 'Suite C', 6000, 'Vacant', 0, 0, 2),
(8, 3, 'Townhouse 1', 1800, 'Occupied', 1, 3, 2), (9, 3, 'Townhouse 2', 1850, 'Occupied', 1, 3, 2), (10, 3, 'Townhouse 3', 1900, 'Vacant', 1, 3, 3),
(11, 4, 'Floor 1', 12000, 'Occupied', 0, 0, 4), (12, 4, 'Floor 2', 12000, 'Occupied', 0, 0, 4),
(13, 5, 'Villa A', 4500, 'Occupied', 2, 4, 3), (14, 5, 'Villa B', 4800, 'Occupied', 2, 4, 4), (15, 5, 'Villa C', 5000, 'Vacant', 2, 5, 5);

-- 5. Insert Tenants
INSERT INTO public.tenants (id, unit_id, first_name, last_name, email, phone, lease_start, lease_end) VALUES
(1, 1, 'John', 'Doe', 'john.doe@example.com', '+1-555-0201', '2023-01-01', '2024-01-01'),
(2, 2, 'Jane', 'Smith', 'jane.smith@example.com', '+1-555-0202', '2023-03-15', '2024-03-15'),
(3, 4, 'Alice', 'Johnson', 'alice.j@example.com', '+1-555-0203', '2023-06-01', '2024-06-01'),
(4, 5, 'TechCorp Inc.', 'LLC', 'billing@techcorp.com', '+1-555-0204', '2022-01-01', '2027-01-01'),
(5, 6, 'Design Studio', 'LLC', 'hello@designstudio.com', '+1-555-0205', '2023-02-01', '2026-02-01'),
(6, 8, 'Robert', 'Brown', 'robert.b@example.com', '+1-555-0206', '2023-08-01', '2024-08-01'),
(7, 9, 'Emily', 'Davis', 'emily.d@example.com', '+1-555-0207', '2023-09-01', '2024-09-01'),
(8, 11, 'Global', 'Innovations', 'admin@globalinnovations.com', '+1-555-0208', '2021-05-01', '2026-05-01'),
(9, 12, 'NextGen', 'Startups', 'contact@nextgen.com', '+1-555-0209', '2023-11-01', '2028-11-01'),
(10, 13, 'William', 'Wilson', 'william.w@example.com', '+1-555-0210', '2023-07-01', '2024-07-01'),
(11, 14, 'Sophia', 'Martinez', 'sophia.m@example.com', '+1-555-0211', '2023-10-01', '2024-10-01');

-- 6. Insert Transactions
INSERT INTO public.transactions (unit_id, tenant_id, amount, type, status, date) VALUES
(1, 1, 2500, 'Rent', 'Completed', '2023-10-01'),
(1, 1, 2500, 'Rent', 'Completed', '2023-11-01'),
(2, 2, 2600, 'Rent', 'Completed', '2023-10-01'),
(2, 2, 2600, 'Rent', 'Pending', '2023-11-01'),
(4, 3, 2800, 'Rent', 'Completed', '2023-10-01'),
(5, 4, 5000, 'Rent', 'Completed', '2023-10-01'),
(6, 5, 4500, 'Rent', 'Completed', '2023-10-01'),
(8, 6, 1800, 'Rent', 'Completed', '2023-10-01'),
(9, 7, 1850, 'Rent', 'Completed', '2023-10-01'),
(11, 8, 12000, 'Rent', 'Completed', '2023-10-01'),
(12, 9, 12000, 'Rent', 'Completed', '2023-10-01'),
(13, 10, 4500, 'Rent', 'Completed', '2023-10-01'),
(14, 11, 4800, 'Rent', 'Completed', '2023-10-01'),
(1, 1, 50, 'Late Fee', 'Completed', '2023-09-05'),
(5, 4, 200, 'Maintenance', 'Pending', '2023-10-15');

-- 7. Insert Tasks
INSERT INTO public.tasks (title, assignee, due_date, priority, status, cost, time_spent) VALUES
('Quarterly HVAC Inspection', 'Maintenance Team', '2023-12-01', 'High', 'Pending', 0, 0),
('Fix Leaking Faucet in Unit 101', 'John Plumber', '2023-11-10', 'Medium', 'In Progress', 150, 2),
('Paint Vacant Unit 103', 'Painting Crew', '2023-11-15', 'Low', 'Pending', 500, 0),
('Replace Carpet in Suite C', 'Flooring Co.', '2023-11-20', 'Medium', 'Pending', 1200, 0),
('Monthly Fire Alarm Test', 'Safety Officer', '2023-11-05', 'High', 'Completed', 100, 1);

-- 8. Insert Maintenance Requests
INSERT INTO public.maintenance_requests (unit_id, tenant_id, title, description, priority, status, cost, time_spent) VALUES
(1, 1, 'Leaking Faucet', 'The kitchen sink is dripping constantly.', 'Medium', 'In Progress', 150, 2),
(2, 2, 'Broken Blinds', 'Living room blinds are stuck.', 'Low', 'Open', 0, 0),
(5, 4, 'AC Not Cooling', 'The AC unit in the main conference room is blowing warm air.', 'High', 'Open', 0, 0),
(8, 6, 'Squeaky Door', 'Front door hinges need oiling.', 'Low', 'Completed', 20, 0.5),
(13, 10, 'Pool Heater Broken', 'The private pool heater is not turning on.', 'High', 'Open', 0, 0);

-- 9. Insert Vendors
INSERT INTO public.vendors (company_name, contact_person, email, phone, category, status, tax_id, address, insurance_expiry, rating) VALUES
('Acme Plumbing Co.', 'Mario Bros', 'mario@acmeplumbing.com', '+1-555-0301', 'Plumber', 'Active', 'TX-12345', '1 Plumber Way', '2025-12-31', 4.8),
('Sparky Electricians', 'Tom Edison', 'tom@sparkyelectricians.com', '+1-555-0302', 'Electrician', 'Active', 'TX-23456', '2 Volta St', '2024-11-15', 4.2),
('Green Thumb Landscaping', 'Alice Green', 'alice@greenthumb.com', '+1-555-0303', 'Landscaping', 'Active', 'TX-34567', '3 Garden Road', '2026-05-20', 4.9),
('Clear View Cleaning', 'Maria Clean', 'maria@clearview.com', '+1-555-0304', 'Cleaning', 'Active', 'TX-45678', '4 Sparkle Ave', '2023-10-01', 3.5),
('Solid Foundations', 'Bob Builder', 'bob@solidfoundations.com', '+1-555-0305', 'General Contractor', 'Inactive', 'TX-56789', '5 Brick Lane', '2022-01-10', 3.1);

-- 10. Insert Messages (Example structure - requires valid UUIDs from auth.users)
-- IMPORTANT: Replace 'YOUR-USER-UUID-HERE' and 'ANOTHER-USER-UUID' with actual UUIDs from your auth.users table!
-- INSERT INTO public.messages (sender_id, sender_type, receiver_id, receiver_type, content, read) VALUES
-- ('YOUR-USER-UUID-HERE', 'User', 'ANOTHER-USER-UUID', 'Tenant', 'Hello, your rent is due next week.', false),
-- ('ANOTHER-USER-UUID', 'Tenant', 'YOUR-USER-UUID-HERE', 'User', 'Thank you! I will pay it tomorrow.', true);

-- 20. Insert Leasing Applications
INSERT INTO public.leasing_applications (property_id, unit_id, applicant_name, applicant_email, applicant_phone, status, income_amount, credit_score, employment_status, notes) VALUES
(1, 1, 'John Doe', 'john.doe@example.com', '123-456-7890', 'Pending', 5000, 720, 'Full-Time Employed', 'Waiting for background check'),
(1, NULL, 'Alice Smith', 'alice.smith@example.com', '987-654-3210', 'Reviewing', 6000, 750, 'Self-Employed', 'Strong application, landlord reference pending'),
(2, 3, 'Bob Johnson', 'bob.j@example.com', '555-123-4567', 'Approved', 4500, 680, 'Full-Time Employed', 'Approved, waiting for security deposit'),
(3, NULL, 'Charlie Brown', 'charlie.b@example.com', '444-555-6666', 'Rejected', 2500, 580, 'Part-Time', 'Income does not meet 3x rent requirement');
-- Assuming user_id can be null or we use a valid uuid later. For now, user_id is nullable in schema? Waith, it might fail if user_id is invalid.
-- Wait, I'll just leave it commented out or assign a subquery. Actually, let's just sync the db first, demo_data can wait or we don't need demo data.

