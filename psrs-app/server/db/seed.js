import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db, initSchema } from './database.js';

export async function runSeed() {
  console.log('--- Initializing Database & Seed Data ---');
  initSchema();

  // Clear existing data to allow clean re-seeding
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM notifications;
    DELETE FROM announcements;
    DELETE FROM support_tickets;
    DELETE FROM faqs;
    DELETE FROM payments;
    DELETE FROM application_status_history;
    DELETE FROM application_documents;
    DELETE FROM applications;
    DELETE FROM services;
    DELETE FROM users;
  `);

  console.log('Clearing old records completed.');

  const now = new Date().toISOString();
  const pastDays = (d) => new Date(Date.now() - d * 86400000).toISOString();

  // 1. Users
  const adminPass = await bcrypt.hash('Admin@2026', 10);
  const staffPass = await bcrypt.hash('Staff@2026', 10);
  const citizenPass = await bcrypt.hash('Citizen@2026', 10);

  const adminId = 'usr-admin-001';
  const officerCivilId = 'usr-officer-civil-002';
  const officerImmigId = 'usr-officer-immig-003';
  const officerDciId = 'usr-officer-dci-004';
  const officerLandsId = 'usr-officer-lands-005';
  const officerCountyId = 'usr-officer-county-006';
  const citizenWanjikuId = 'usr-citizen-wanjiku-007';
  const citizenOmondiId = 'usr-citizen-omondi-008';

  const users = [
    {
      id: adminId,
      full_name: 'David Kiprono (Admin)',
      national_id: '10000001',
      email: 'admin@psrs.go.ke',
      phone: '0700000001',
      password_hash: adminPass,
      role: 'admin',
      department: 'Executive Coordination',
      county: 'Nairobi',
      sub_county: 'Nairobi Central',
      status: 'active'
    },
    {
      id: officerCivilId,
      full_name: 'James Mwangi',
      national_id: '18294012',
      email: 'officer.civil@psrs.go.ke',
      phone: '0722111222',
      password_hash: staffPass,
      role: 'staff',
      department: 'Civil Registration Services',
      county: 'Nairobi',
      sub_county: 'Starehe',
      status: 'active'
    },
    {
      id: officerImmigId,
      full_name: 'Amina Hassan',
      national_id: '20491823',
      email: 'officer.immig@psrs.go.ke',
      phone: '0733222333',
      password_hash: staffPass,
      role: 'staff',
      department: 'Directorate of Immigration',
      county: 'Nairobi',
      sub_county: 'Nyayo House',
      status: 'active'
    },
    {
      id: officerDciId,
      full_name: 'Inspector Kiprop Cheruiyot',
      national_id: '19482019',
      email: 'officer.dci@psrs.go.ke',
      phone: '0720444555',
      password_hash: staffPass,
      role: 'staff',
      department: 'Directorate of Criminal Investigations',
      county: 'Nairobi',
      sub_county: 'Mazingira House',
      status: 'active'
    },
    {
      id: officerLandsId,
      full_name: 'Grace Wambui',
      national_id: '22849102',
      email: 'officer.lands@psrs.go.ke',
      phone: '0711666777',
      password_hash: staffPass,
      role: 'staff',
      department: 'Ministry of Lands & Physical Planning',
      county: 'Nairobi',
      sub_county: 'Ardhi House',
      status: 'active'
    },
    {
      id: officerCountyId,
      full_name: 'Dennis Odhiambo',
      national_id: '24910294',
      email: 'officer.county@psrs.go.ke',
      phone: '0729888999',
      password_hash: staffPass,
      role: 'staff',
      department: 'County Urban Works & Environment',
      county: 'Nairobi',
      sub_county: 'City Hall',
      status: 'active'
    },
    {
      id: citizenWanjikuId,
      full_name: 'Faith Wanjiku Mwangi',
      national_id: '29481024',
      email: 'citizen.wanjiku@example.ke',
      phone: '0712345678',
      password_hash: citizenPass,
      role: 'citizen',
      department: null,
      county: 'Nairobi',
      sub_county: 'Westlands',
      status: 'active'
    },
    {
      id: citizenOmondiId,
      full_name: 'Brian Omondi Otieno',
      national_id: '31092834',
      email: 'citizen.omondi@example.ke',
      phone: '0722987654',
      password_hash: citizenPass,
      role: 'citizen',
      department: null,
      county: 'Kisumu',
      sub_county: 'Kisumu Central',
      status: 'active'
    }
  ];

  for (const u of users) {
    db.run(
      `INSERT INTO users (id, full_name, national_id, email, phone, password_hash, role, department, county, sub_county, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.full_name, u.national_id, u.email, u.phone, u.password_hash, u.role, u.department, u.county, u.sub_county, u.status, pastDays(30), pastDays(1)]
    );
  }
  console.log(`Seeded ${users.length} users (Admin, Staff officers, Citizens).`);

  // 2. Services
  const services = [
    {
      id: 'svc-birth-cert',
      slug: 'first-time-birth-certificate',
      name: 'First-Time Birth Certificate (Minor)',
      category: 'Civil Registration',
      department: 'Civil Registration Services',
      description: 'Official registration and issuance of standard Kenyan birth certificates for infants and minors born within Kenya.',
      eligibility: 'Parents or legal guardians of children born in Kenya who possess a hospital birth notification.',
      required_documents: JSON.stringify([
        { id: 'doc-hospital-notify', name: 'Hospital Birth Notification', required: true, description: 'Official notification slip stamped by health facility where birth occurred.' },
        { id: 'doc-mother-id', name: "Mother's National ID / Passport", required: true, description: "Clear photocopy of mother's National Identity card or valid passport." },
        { id: 'doc-father-id', name: "Father's National ID / Passport", required: false, description: "Photocopy of father's National Identity card (where applicable)." }
      ]),
      fee_kes: 200,
      processing_time_days: 5,
      instructions: 'Ensure hospital notification slip bears the official registration seal. Verify spelling of child and parental names before submission.',
      form_fields: JSON.stringify([
        { name: 'child_full_name', label: 'Child Full Legal Name', type: 'text', required: true, placeholder: 'e.g. Liam Mwangi Njoroge' },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
        { name: 'place_of_birth', label: 'Health Facility / Hospital Name', type: 'text', required: true, placeholder: 'e.g. Pumwani Maternity Hospital' },
        { name: 'mother_full_name', label: "Mother's Full Name", type: 'text', required: true },
        { name: 'mother_id_number', label: "Mother's National ID No.", type: 'text', required: true },
        { name: 'father_full_name', label: "Father's Full Name", type: 'text', required: false },
        { name: 'county_of_birth', label: 'County of Birth', type: 'text', required: true, placeholder: 'e.g. Nairobi' }
      ])
    },
    {
      id: 'svc-death-cert',
      slug: 'certified-death-certificate',
      name: 'Certified Death Certificate Application',
      category: 'Civil Registration',
      department: 'Civil Registration Services',
      description: 'Formal application for issuance of a certified copy of Death Certificate for estate administration, succession, and legal closure.',
      eligibility: 'Immediate family members, designated next of kin, or registered legal administrators.',
      required_documents: JSON.stringify([
        { id: 'doc-death-cause', name: 'Medical Certificate of Cause of Death', required: true, description: 'Form D4 signed by attending medical officer or pathologist.' },
        { id: 'doc-burial-permit', name: 'Burial Permit Copy', required: true, description: 'Copy of burial permit issued by local health or administrative authority.' },
        { id: 'doc-informant-id', name: "Informant's National ID", required: true, description: "Copy of applicant / informant's National ID." }
      ]),
      fee_kes: 150,
      processing_time_days: 3,
      instructions: 'Submit certified copies of the cause of death notice and surrender original national ID of the deceased during collection.',
      form_fields: JSON.stringify([
        { name: 'deceased_full_name', label: 'Full Legal Name of Deceased', type: 'text', required: true },
        { name: 'deceased_id_number', label: 'Deceased National ID No.', type: 'text', required: true },
        { name: 'date_of_death', label: 'Date of Decease', type: 'date', required: true },
        { name: 'place_of_death', label: 'Place of Death (Hospital/Home)', type: 'text', required: true },
        { name: 'relationship_to_deceased', label: 'Relationship to Deceased', type: 'select', required: true, options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Legal Administrator'] }
      ])
    },
    {
      id: 'svc-national-id',
      slug: 'first-time-national-id',
      name: 'First-Time National ID Card (18+)',
      category: 'Identity & Immigration',
      department: 'National Registration Bureau',
      description: 'Registration and issuance of the Republic of Kenya National Identity Card for citizens attaining 18 years of age.',
      eligibility: 'Kenyan citizens aged 18 years and above applying for their maiden identification card.',
      required_documents: JSON.stringify([
        { id: 'doc-birth-cert', name: 'Original Birth Certificate Copy', required: true, description: 'Valid Kenyan Birth Certificate or Certificate of Age Assessment.' },
        { id: 'doc-parents-id', name: "Parents' National IDs", required: true, description: 'Copies of both parents’ National Identity cards.' },
        { id: 'doc-chief-letter', name: "Chief's Recommendation Letter", required: true, description: 'Letter from local Assistant Chief verifying residence and citizenship.' }
      ]),
      fee_kes: 1000,
      processing_time_days: 14,
      instructions: 'After submitting this digital pre-application, visit the designated sub-county registration office for biometrics capture (fingerprints & portrait).',
      form_fields: JSON.stringify([
        { name: 'applicant_full_name', label: 'Full Names (as per Birth Certificate)', type: 'text', required: true },
        { name: 'birth_cert_entry_no', label: 'Birth Certificate Entry Number', type: 'text', required: true },
        { name: 'clan_or_ethnicity', label: 'Sub-tribe / Clan', type: 'text', required: false },
        { name: 'home_county', label: 'County of Origin', type: 'text', required: true },
        { name: 'sub_county_domicile', label: 'Sub-County of Residence', type: 'text', required: true },
        { name: 'chief_name', label: 'Local Assistant Chief Name', type: 'text', required: true }
      ])
    },
    {
      id: 'svc-passport-renewal',
      slug: 'ordinary-passport-renewal',
      name: 'Ordinary Passport Renewal (32-Page)',
      category: 'Identity & Immigration',
      department: 'Directorate of Immigration',
      description: 'Renewal of expiring or full Kenyan ordinary biometric passport (Series A, 32 pages).',
      eligibility: 'Kenyan passport holders whose travel documents have expired, are within 6 months of expiry, or have filled all visa pages.',
      required_documents: JSON.stringify([
        { id: 'doc-old-passport', name: 'Old Passport Bio-data Page', required: true, description: 'Clear scan of passport photo page and pages 30-32.' },
        { id: 'doc-national-id', name: 'National ID Copy', required: true, description: 'Clear front and back scan of Kenyan National ID.' },
        { id: 'doc-passport-photo', name: 'Passport Size Photograph', required: true, description: 'Recent white-background photograph meeting ICAO passport guidelines.' }
      ]),
      fee_kes: 7550,
      processing_time_days: 10,
      instructions: 'Present your current physical passport book at the immigration station (Nyayo House or regional center) during collection for cancellation.',
      form_fields: JSON.stringify([
        { name: 'current_passport_no', label: 'Current Passport Number', type: 'text', required: true, placeholder: 'e.g. AK1289410' },
        { name: 'expiry_date', label: 'Passport Expiry Date', type: 'date', required: true },
        { name: 'occupation', label: 'Profession / Occupation', type: 'text', required: true },
        { name: 'collection_center', label: 'Preferred Collection Center', type: 'select', required: true, options: ['Nyayo House (Nairobi)', 'Mombasa Regional Center', 'Kisumu Regional Center', 'Nakuru Regional Center', 'Eldoret Regional Center'] }
      ])
    },
    {
      id: 'svc-police-clearance',
      slug: 'certificate-of-good-conduct',
      name: 'Police Clearance Certificate (Good Conduct)',
      category: 'Police Services',
      department: 'Directorate of Criminal Investigations (DCI)',
      description: 'DCI forensic criminal record check and issuance of official Police Clearance Certificate for employment, licensing, and overseas travel.',
      eligibility: 'All Kenyan citizens and resident aliens requiring criminal record verification.',
      required_documents: JSON.stringify([
        { id: 'doc-c24-form', name: 'Fingerprint Form C-24 Copy', required: true, description: 'DCI Form C-24 stamped by police station or biometric center.' },
        { id: 'doc-id-card', name: 'National ID / Alien ID Copy', required: true, description: 'Clear scan of valid identification document.' }
      ]),
      fee_kes: 1050,
      processing_time_days: 7,
      instructions: 'Book a biometric fingerprint capture appointment at your nearest DCI Sub-County Headquarters or Huduma Centre.',
      form_fields: JSON.stringify([
        { name: 'purpose_of_certificate', label: 'Purpose of Clearance', type: 'select', required: true, options: ['Employment Screening', 'Public Service Appointment', 'Overseas Travel / Visa', 'Business Tender Compliance', 'School Admission'] },
        { name: 'fingerprint_station', label: 'DCI Fingerprint Capture Station', type: 'text', required: true, placeholder: 'e.g. DCI Starehe / Huduma GPO' },
        { name: 'previous_conviction', label: 'Have you ever been convicted of a penal offence?', type: 'select', required: true, options: ['No', 'Yes'] }
      ])
    },
    {
      id: 'svc-business-name',
      slug: 'business-name-registration',
      name: 'Registration of Business Name (Sole/Partnership)',
      category: 'Business Services',
      department: 'Business Registration Service (BRS)',
      description: 'Formal reservation and registration of a business trading name under the Business Names Act, Chapter 499.',
      eligibility: 'Kenyan individuals or partners over 18 years seeking formal legal registration of enterprise names.',
      required_documents: JSON.stringify([
        { id: 'doc-proprietor-id', name: 'Proprietor(s) National ID Copy', required: true, description: 'Clear copies of ID cards for all listed proprietors.' },
        { id: 'doc-kra-pin', name: 'KRA PIN Certificate', required: true, description: 'Copy of active individual KRA PIN certificate.' }
      ]),
      fee_kes: 950,
      processing_time_days: 2,
      instructions: 'Propose up to two prioritized alternative names. Name search is executed automatically before registration is granted.',
      form_fields: JSON.stringify([
        { name: 'proposed_name_primary', label: 'Primary Proposed Business Name', type: 'text', required: true, placeholder: 'e.g. Safari Greens Agribusiness' },
        { name: 'proposed_name_alternate', label: 'Alternate Name (if primary taken)', type: 'text', required: true, placeholder: 'e.g. Safari Greens Enterprise' },
        { name: 'nature_of_business', label: 'Primary Nature of Business', type: 'select', required: true, options: ['General Retail & Wholesale', 'Agriculture & Livestock', 'Information Technology & Consulting', 'Transport & Logistics', 'Food & Hospitality', 'Construction & Civil Works'] },
        { name: 'physical_business_address', label: 'Physical Premises / Street Address', type: 'text', required: true }
      ])
    },
    {
      id: 'svc-single-business-permit',
      slug: 'county-single-business-permit',
      name: 'County Single Business Permit (SBP)',
      category: 'Business Services',
      department: 'County Revenue Services',
      description: 'County government regulatory trading license enabling compliant operation of commercial and professional premises within the county jurisdiction.',
      eligibility: 'Registered business owners occupying commercial premises or operating trade stalls within the county.',
      required_documents: JSON.stringify([
        { id: 'doc-brs-cert', name: 'BRS Registration Certificate', required: true, description: 'Copy of Certificate of Incorporation or Business Name Registration.' },
        { id: 'doc-premises-lease', name: 'Tenancy / Lease Agreement', required: false, description: 'Lease agreement or rate clearance certificate for premises.' }
      ]),
      fee_kes: 5000,
      processing_time_days: 4,
      instructions: 'County trade inspectors verify square footage and fire safety standards before perpetual annual permit is issued.',
      form_fields: JSON.stringify([
        { name: 'business_registration_no', label: 'BRS Registration Number', type: 'text', required: true, placeholder: 'e.g. BN-2024-91820' },
        { name: 'premises_area_sqm', label: 'Premises Floor Area (approx. sq. meters)', type: 'number', required: true, placeholder: '50' },
        { name: 'number_of_employees', label: 'Number of Staff / Employees', type: 'number', required: true, placeholder: '4' },
        { name: 'ward_location', label: 'Ward / Commercial Zone', type: 'text', required: true, placeholder: 'e.g. Kilimani Ward' }
      ])
    },
    {
      id: 'svc-land-search',
      slug: 'official-land-title-search',
      name: 'Official Land Title Search (Search Certificate)',
      category: 'Land Services',
      department: 'Ministry of Lands & Physical Planning',
      description: 'Statutory verification of land ownership, encumbrances, charges, caveats, and restrictions registered against a land parcel.',
      eligibility: 'Registered proprietors, financial institutions, advocates, and bona fide prospective land purchasers.',
      required_documents: JSON.stringify([
        { id: 'doc-title-deed', name: 'Title Deed / Lease Document Copy', required: true, description: 'Clear copy of title deed or certificate of lease showing parcel number.' },
        { id: 'doc-searcher-id', name: "Applicant's National ID", required: true, description: "National ID copy of applicant conducting search." }
      ]),
      fee_kes: 500,
      processing_time_days: 1,
      instructions: 'Enter precise parcel title registry number. Official search certificate with registry seal is delivered digitally within 24 hours.',
      form_fields: JSON.stringify([
        { name: 'title_parcel_number', label: 'Land Parcel Title Number', type: 'text', required: true, placeholder: 'e.g. NAIROBI/BLOCK 82/104' },
        { name: 'lands_registry_office', label: 'Lands Registry Station', type: 'select', required: true, options: ['Ardhi House (Central Registry)', 'Nairobi Lands Registry', 'Mombasa Lands Registry', 'Kisumu Lands Registry', 'Nakuru Lands Registry', 'Kiambu Lands Registry'] },
        { name: 'search_purpose', label: 'Purpose of Search', type: 'select', required: true, options: ['Due Diligence for Purchase', 'Bank Collateral / Charge', 'Court Litigation', 'Succession / Estate Audit'] }
      ])
    },
    {
      id: 'svc-drainage-complaint',
      slug: 'public-drainage-flood-risk-report',
      name: 'Public Drainage & Flood Risk Report',
      category: 'County Services',
      department: 'County Urban Works & Infrastructure',
      description: 'Civic report for obstructed storm water culverts, blocked roadside drainages, and localized flood hazards requiring municipal unclogging.',
      eligibility: 'Open to all residents, estate associations, and road users within the county.',
      required_documents: JSON.stringify([
        { id: 'doc-incident-photo', name: 'Site / Drainage Photographs', required: true, description: 'Photographs displaying the blocked culvert, overflow, or road damage.' }
      ]),
      fee_kes: 0,
      processing_time_days: 3,
      instructions: 'Civic reports are complimentary. County road maintenance dispatch will be scheduled based on priority assessment.',
      form_fields: JSON.stringify([
        { name: 'incident_location', label: 'Specific Road / Estate Landmark', type: 'text', required: true, placeholder: 'e.g. Junction of Ring Road & Argwings Kodhek' },
        { name: 'severity_level', label: 'Urgency & Water Risk Level', type: 'select', required: true, options: ['Critical (Active structural flooding)', 'Moderate (Water pooling on road)', 'Preventative (Silted culvert before rains)'] },
        { name: 'description_of_blockage', label: 'Details of Obstruction / Issue', type: 'textarea', required: true, placeholder: 'Describe what is causing the blockage...' }
      ])
    },
    {
      id: 'svc-waste-complaint',
      slug: 'municipal-waste-collection-complaint',
      name: 'Municipal Waste Collection & Illegal Dumping Complaint',
      category: 'County Services',
      department: 'County Environment & Sanitation',
      description: 'Lodge an official service ticket for missed municipal garbage collection schedules or report unauthorized illegal dumping in public areas.',
      eligibility: 'All county residents, business operators, and environmental stewards.',
      required_documents: JSON.stringify([
        { id: 'doc-site-photo', name: 'Site Photograph', required: true, description: 'Photo of unattended garbage accumulation or dumping site.' }
      ]),
      fee_kes: 0,
      processing_time_days: 2,
      instructions: 'Complimentary civic sanitation service. Environmental compliance officers investigate and coordinate refuse trucks.',
      form_fields: JSON.stringify([
        { name: 'estate_name', label: 'Estate / Neighborhood Name', type: 'text', required: true, placeholder: 'e.g. Umoja Innercore / South C' },
        { name: 'complaint_type', label: 'Type of Sanitation Issue', type: 'select', required: true, options: ['Missed Scheduled Collection', 'Illegal Waste Dumping on Public Road', 'Overflowing Municipal Skip Trash Bin', 'Hazardous Commercial Waste'] },
        { name: 'exact_pinpoint', label: 'Exact Street / Landmark', type: 'text', required: true }
      ])
    }
  ];

  for (const s of services) {
    db.run(
      `INSERT INTO services (
        id, slug, name, category, department, description, eligibility,
        required_documents, fee_kes, processing_time_days, instructions, form_fields, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        s.id, s.slug, s.name, s.category, s.department, s.description, s.eligibility,
        s.required_documents, s.fee_kes, s.processing_time_days, s.instructions, s.form_fields, pastDays(60), pastDays(2)
      ]
    );
  }
  console.log(`Seeded ${services.length} realistic public services across 6 categories.`);

  // 3. Pre-seeded Realistic Applications
  const applications = [
    {
      id: 'app-crb-90214',
      reference_number: 'PSRS-2026-CRB-90214',
      user_id: citizenWanjikuId,
      service_id: 'svc-birth-cert',
      status: 'Submitted',
      form_data: JSON.stringify({
        child_full_name: 'Liam Mwangi Njoroge',
        date_of_birth: '2026-08-14',
        gender: 'Male',
        place_of_birth: 'Pumwani Maternity Hospital',
        mother_full_name: 'Faith Wanjiku Mwangi',
        mother_id_number: '29481024',
        father_full_name: 'Samuel Njoroge Kamau',
        county_of_birth: 'Nairobi'
      }),
      assigned_staff_id: officerCivilId,
      created_at: pastDays(4),
      updated_at: pastDays(4)
    },
    {
      id: 'app-imm-18492',
      reference_number: 'PSRS-2026-IMM-18492',
      user_id: citizenWanjikuId,
      service_id: 'svc-passport-renewal',
      status: 'Under Review',
      form_data: JSON.stringify({
        current_passport_no: 'AK0918231',
        expiry_date: '2026-12-01',
        occupation: 'Software Engineer',
        collection_center: 'Nyayo House (Nairobi)'
      }),
      assigned_staff_id: officerImmigId,
      created_at: pastDays(8),
      updated_at: pastDays(3)
    },
    {
      id: 'app-pol-44102',
      reference_number: 'PSRS-2026-POL-44102',
      user_id: citizenWanjikuId,
      service_id: 'svc-police-clearance',
      status: 'Action Required',
      action_required_note: 'Please provide a clearer digital scan of Fingerprint Form C-24; the left thumb impression is smudged and unreadable by the forensic automated biometric system.',
      form_data: JSON.stringify({
        purpose_of_certificate: 'Employment Screening',
        fingerprint_station: 'DCI Starehe Headquarters',
        previous_conviction: 'No'
      }),
      assigned_staff_id: officerDciId,
      created_at: pastDays(12),
      updated_at: pastDays(2)
    },
    {
      id: 'app-lnd-77190',
      reference_number: 'PSRS-2026-LND-77190',
      user_id: citizenOmondiId,
      service_id: 'svc-land-search',
      status: 'Approved',
      approval_remarks: 'Official title search completed and verified against register folio. Title parcel NAIROBI/BLOCK 82/104 is certified free of encumbrances or caveats.',
      form_data: JSON.stringify({
        title_parcel_number: 'NAIROBI/BLOCK 82/104',
        lands_registry_office: 'Ardhi House (Central Registry)',
        search_purpose: 'Due Diligence for Purchase'
      }),
      assigned_staff_id: officerLandsId,
      created_at: pastDays(6),
      updated_at: pastDays(1)
    },
    {
      id: 'app-brs-32091',
      reference_number: 'PSRS-2026-BRS-32091',
      user_id: citizenOmondiId,
      service_id: 'svc-business-name',
      status: 'Completed',
      approval_remarks: 'Business name "Safari Greens Agribusiness" successfully registered under Registration No. BN-2026-44912. Certificate issued.',
      form_data: JSON.stringify({
        proposed_name_primary: 'Safari Greens Agribusiness',
        proposed_name_alternate: 'Safari Greens Enterprise',
        nature_of_business: 'Agriculture & Livestock',
        physical_business_address: 'Mezzanine 2, Hazina Towers, Monrovia Street, Nairobi'
      }),
      assigned_staff_id: officerCivilId,
      created_at: pastDays(18),
      updated_at: pastDays(16)
    },
    {
      id: 'app-cty-55109',
      reference_number: 'PSRS-2026-CTY-55109',
      user_id: citizenWanjikuId,
      service_id: 'svc-drainage-complaint',
      status: 'Under Review',
      form_data: JSON.stringify({
        incident_location: 'Argwings Kodhek Road near Chaka Place, Hurlingham',
        severity_level: 'Moderate (Water pooling on road)',
        description_of_blockage: 'Storm drainage grates are blocked by soil erosion and silt after heavy evening downpour.'
      }),
      assigned_staff_id: officerCountyId,
      created_at: pastDays(1),
      updated_at: pastDays(1)
    }
  ];

  for (const a of applications) {
    db.run(
      `INSERT INTO applications (
        id, reference_number, user_id, service_id, status, form_data,
        assigned_staff_id, action_required_note, approval_remarks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id, a.reference_number, a.user_id, a.service_id, a.status, a.form_data,
        a.assigned_staff_id || null, a.action_required_note || null, a.approval_remarks || null, a.created_at, a.updated_at
      ]
    );
  }
  console.log(`Seeded ${applications.length} applications across various operational states.`);

  // 4. Sample Documents Metadata
  const sampleDocs = [
    {
      id: 'doc-item-01',
      app_id: 'app-crb-90214',
      name: 'Hospital Birth Notification',
      orig: 'Pumwani_Birth_Notification_Liam.pdf',
      file: 'doc-birth-notification-001.pdf',
      size: 412000,
      mime: 'application/pdf',
      date: pastDays(4)
    },
    {
      id: 'doc-item-02',
      app_id: 'app-crb-90214',
      name: "Mother's National ID",
      orig: 'National_ID_Wanjiku_29481024.jpg',
      file: 'doc-id-wanjiku-001.jpg',
      size: 680000,
      mime: 'image/jpeg',
      date: pastDays(4)
    },
    {
      id: 'doc-item-03',
      app_id: 'app-imm-18492',
      name: 'Old Passport Bio-data Page',
      orig: 'Passport_AK0918231_Biodata.pdf',
      file: 'doc-passport-wanjiku.pdf',
      size: 890000,
      mime: 'application/pdf',
      date: pastDays(8)
    },
    {
      id: 'doc-item-04',
      app_id: 'app-pol-44102',
      name: 'Fingerprint Form C-24 Copy',
      orig: 'Fingerprint_Form_C24_Draft.jpg',
      file: 'doc-c24-fingerprint.jpg',
      size: 520000,
      mime: 'image/jpeg',
      date: pastDays(12)
    },
    {
      id: 'doc-item-05',
      app_id: 'app-lnd-77190',
      name: 'Title Deed Copy',
      orig: 'Title_Deed_NBI_Block82_104.pdf',
      file: 'doc-title-omondi.pdf',
      size: 1120000,
      mime: 'application/pdf',
      date: pastDays(6)
    }
  ];

  for (const d of sampleDocs) {
    db.run(
      `INSERT INTO application_documents (
        id, application_id, document_name, original_filename, stored_filename, file_path, file_size_bytes, mime_type, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.app_id, d.name, d.orig, d.file, `/uploads/${d.file}`, d.size, d.mime, d.date]
    );
  }

  // 5. Status History
  const histories = [
    { app_id: 'app-crb-90214', prev: null, next: 'Submitted', by: citizenWanjikuId, remarks: 'Application lodged by citizen with statutory fee paid.', time: pastDays(4) },
    { app_id: 'app-imm-18492', prev: null, next: 'Submitted', by: citizenWanjikuId, remarks: 'Maiden submission lodged.', time: pastDays(8) },
    { app_id: 'app-imm-18492', prev: 'Submitted', next: 'Under Review', by: officerImmigId, remarks: 'Assigned to officer Amina Hassan. Biometric verification in progress.', time: pastDays(3) },
    { app_id: 'app-pol-44102', prev: null, next: 'Submitted', by: citizenWanjikuId, remarks: 'Clearance application initiated.', time: pastDays(12) },
    { app_id: 'app-pol-44102', prev: 'Submitted', next: 'Under Review', by: officerDciId, remarks: 'Officer Kiprop Cheruiyot reviewing fingerprint scans.', time: pastDays(7) },
    { app_id: 'app-pol-44102', prev: 'Under Review', next: 'Action Required', by: officerDciId, remarks: 'Discrepancy noted: Fingerprint Form C-24 scan smudged on left thumb.', time: pastDays(2) },
    { app_id: 'app-lnd-77190', prev: null, next: 'Submitted', by: citizenOmondiId, remarks: 'Search request submitted.', time: pastDays(6) },
    { app_id: 'app-lnd-77190', prev: 'Submitted', next: 'Under Review', by: officerLandsId, remarks: 'Registry clerk retrieving parcel folio.', time: pastDays(4) },
    { app_id: 'app-lnd-77190', prev: 'Under Review', next: 'Approved', by: officerLandsId, remarks: 'Search report finalized and endorsed by Land Registrar.', time: pastDays(1) },
    { app_id: 'app-brs-32091', prev: null, next: 'Submitted', by: citizenOmondiId, remarks: 'Application lodged.', time: pastDays(18) },
    { app_id: 'app-brs-32091', prev: 'Submitted', next: 'Under Review', by: officerCivilId, remarks: 'Name search executed. Primary name is available.', time: pastDays(17) },
    { app_id: 'app-brs-32091', prev: 'Under Review', next: 'Completed', by: officerCivilId, remarks: 'Registration certificate BN-2026-44912 generated and finalized.', time: pastDays(16) }
  ];

  for (const h of histories) {
    db.run(
      `INSERT INTO application_status_history (id, application_id, previous_status, new_status, changed_by_user_id, remarks, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), h.app_id, h.prev, h.next, h.by, h.remarks, h.time]
    );
  }

  // 6. Realistic Payments
  const payments = [
    {
      id: 'pay-001',
      reference_number: 'PAY-2026-81920',
      application_id: 'app-crb-90214',
      user_id: citizenWanjikuId,
      amount_kes: 200,
      payment_method: 'mpesa',
      phone_number: '0712345678',
      transaction_reference: 'QKJ8912LA3',
      status: 'Completed',
      is_simulated: 1,
      paid_at: pastDays(4),
      created_at: pastDays(4)
    },
    {
      id: 'pay-002',
      reference_number: 'PAY-2026-31980',
      application_id: 'app-imm-18492',
      user_id: citizenWanjikuId,
      amount_kes: 7550,
      payment_method: 'mpesa',
      phone_number: '0712345678',
      transaction_reference: 'QK81920LMN',
      status: 'Completed',
      is_simulated: 1,
      paid_at: pastDays(8),
      created_at: pastDays(8)
    },
    {
      id: 'pay-003',
      reference_number: 'PAY-2026-44819',
      application_id: 'app-pol-44102',
      user_id: citizenWanjikuId,
      amount_kes: 1050,
      payment_method: 'mpesa',
      phone_number: '0712345678',
      transaction_reference: 'QK49201OPQ',
      status: 'Completed',
      is_simulated: 1,
      paid_at: pastDays(12),
      created_at: pastDays(12)
    },
    {
      id: 'pay-004',
      reference_number: 'PAY-2026-77821',
      application_id: 'app-lnd-77190',
      user_id: citizenOmondiId,
      amount_kes: 500,
      payment_method: 'mpesa',
      phone_number: '0722987654',
      transaction_reference: 'QK77821RST',
      status: 'Completed',
      is_simulated: 1,
      paid_at: pastDays(6),
      created_at: pastDays(6)
    },
    {
      id: 'pay-005',
      reference_number: 'PAY-2026-32091',
      application_id: 'app-brs-32091',
      user_id: citizenOmondiId,
      amount_kes: 950,
      payment_method: 'mpesa',
      phone_number: '0722987654',
      transaction_reference: 'QK32091UVW',
      status: 'Completed',
      is_simulated: 1,
      paid_at: pastDays(18),
      created_at: pastDays(18)
    }
  ];

  for (const p of payments) {
    db.run(
      `INSERT INTO payments (
        id, reference_number, application_id, user_id, amount_kes,
        payment_method, phone_number, transaction_reference, status, is_simulated, paid_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.reference_number, p.application_id, p.user_id, p.amount_kes, p.payment_method, p.phone_number, p.transaction_reference, p.status, p.is_simulated, p.paid_at, p.created_at]
    );
  }

  // 7. Notifications
  const notifs = [
    {
      id: 'notif-01',
      user_id: citizenWanjikuId,
      title: 'Action Required on DCI Clearance',
      message: 'Police Clearance application #PSRS-2026-POL-44102 requires a clearer scan of Fingerprint Form C-24.',
      link: '/citizen/applications/app-pol-44102',
      is_read: 0,
      type: 'action_required',
      created_at: pastDays(2)
    },
    {
      id: 'notif-02',
      user_id: citizenWanjikuId,
      title: 'Passport Application Under Review',
      message: 'Passport renewal #PSRS-2026-IMM-18492 is actively under review by Immigration officer Amina Hassan.',
      link: '/citizen/applications/app-imm-18492',
      is_read: 1,
      type: 'status_update',
      created_at: pastDays(3)
    },
    {
      id: 'notif-03',
      user_id: citizenWanjikuId,
      title: 'Payment Confirmed: KES 200',
      message: 'Receipt #PAY-2026-81920 generated for Birth Certificate application #PSRS-2026-CRB-90214.',
      link: '/citizen/payments/pay-001',
      is_read: 1,
      type: 'payment',
      created_at: pastDays(4)
    },
    {
      id: 'notif-04',
      user_id: citizenOmondiId,
      title: 'Land Search Approved',
      message: 'Official search for parcel NAIROBI/BLOCK 82/104 has been approved and endorsed by the Land Registrar.',
      link: '/citizen/applications/app-lnd-77190',
      is_read: 0,
      type: 'status_update',
      created_at: pastDays(1)
    }
  ];

  for (const n of notifs) {
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.user_id, n.title, n.message, n.link, n.is_read, n.type, n.created_at]
    );
  }

  // 8. Public Announcements
  const announcements = [
    {
      id: 'ann-01',
      title: 'Gazetted Public Holiday: Processing Schedule Advisory',
      summary: 'Public service application processing operations will pause on the scheduled national holiday.',
      content: 'Citizens are notified that in observance of the upcoming national holiday, processing times across Civil Registration, Immigration, and Lands will resume the subsequent working day. Digital application lodgments remain accessible 24/7.',
      priority: 'important',
      created_by: adminId,
      created_at: pastDays(1)
    },
    {
      id: 'ann-02',
      title: 'Digital Land Search Integration & Instant Registry Certification',
      summary: 'Official Land Searches across Nairobi, Kiambu, and Mombasa registries are now processed within 24 business hours.',
      content: 'The Ministry of Lands has expedited official search record retrieval. Citizens can download certified digital title search certificates directly from their dashboard upon approval.',
      priority: 'normal',
      created_by: adminId,
      created_at: pastDays(5)
    },
    {
      id: 'ann-03',
      title: 'Advisory on High-Volume Passport Processing Centers',
      summary: 'Biometric capture appointments at Nyayo House are experiencing high turnout; regional stations recommended.',
      content: 'Applicants for ordinary 32-page and 50-page passports are encouraged to select regional biometric collection stations (Nakuru, Eldoret, Kisumu, or Mombasa) to benefit from shorter turnaround intervals.',
      priority: 'normal',
      created_by: adminId,
      created_at: pastDays(10)
    }
  ];

  for (const ann of announcements) {
    db.run(
      `INSERT INTO announcements (id, title, summary, content, priority, is_published, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [ann.id, ann.title, ann.summary, ann.content, ann.priority, ann.created_by, ann.created_at]
    );
  }

  // 9. FAQs
  const faqs = [
    {
      id: 'faq-01',
      category: 'General',
      question: 'What is the Kenyan Public Service Request System (PSRS)?',
      answer: 'PSRS is a centralized digital gateway enabling Kenyan citizens to discover government services, lodge verified applications, submit digital documentation, pay statutory fees, and track request milestones with institutional accountability.',
      display_order: 1
    },
    {
      id: 'faq-02',
      category: 'Payments',
      question: 'How do statutory fee payments work on this platform?',
      answer: 'Fees are paid through integrated simulated mobile money (M-Pesa Express STK Push) or debit/credit card. Every confirmed transaction generates an official receipt with a traceable government transaction reference.',
      display_order: 2
    },
    {
      id: 'faq-03',
      category: 'Applications',
      question: 'What does the "Action Required" status mean?',
      answer: '"Action Required" indicates that the reviewing government officer requires additional documentation, clearer scans, or information clarification. You will receive a direct notification detailing the required correction.',
      display_order: 3
    },
    {
      id: 'faq-04',
      category: 'Tracking',
      question: 'Can I track my application without logging into an account?',
      answer: 'Yes. The Public Request Tracking portal allows any citizen with an official reference number (e.g. PSRS-2026-CRB-90214) to view verified progress milestones and status history while protecting private identity data.',
      display_order: 4
    },
    {
      id: 'faq-05',
      category: 'Security',
      question: 'How is citizen personal data protected on PSRS?',
      answer: 'The system enforces strict role-based access control, cryptographic password hashing (bcrypt), encrypted sessions (JWT), sanitized document uploads, and immutable administrative audit logs on every status transition.',
      display_order: 5
    }
  ];

  for (const f of faqs) {
    db.run(
      'INSERT INTO faqs (id, category, question, answer, display_order) VALUES (?, ?, ?, ?, ?)',
      [f.id, f.category, f.question, f.answer, f.display_order]
    );
  }

  // 10. Audit Logs
  const auditEntries = [
    {
      user_id: adminId,
      user_email: 'admin@psrs.go.ke',
      action: 'SYSTEM_INITIALIZATION',
      entity_type: 'system',
      entity_id: 'sys-001',
      details: JSON.stringify({ version: '1.0.0', catalog_services: services.length }),
      ip_address: '127.0.0.1',
      timestamp: pastDays(30)
    },
    {
      user_id: officerDciId,
      user_email: 'officer.dci@psrs.go.ke',
      action: 'STATUS_UPDATED',
      entity_type: 'application',
      entity_id: 'app-pol-44102',
      details: JSON.stringify({ referenceNumber: 'PSRS-2026-POL-44102', previousStatus: 'Under Review', newStatus: 'Action Required', note: 'Fingerprint scan smudged.' }),
      ip_address: '10.0.4.15',
      timestamp: pastDays(2)
    },
    {
      user_id: officerLandsId,
      user_email: 'officer.lands@psrs.go.ke',
      action: 'STATUS_UPDATED',
      entity_type: 'application',
      entity_id: 'app-lnd-77190',
      details: JSON.stringify({ referenceNumber: 'PSRS-2026-LND-77190', previousStatus: 'Under Review', newStatus: 'Approved', remarks: 'Title search verified.' }),
      ip_address: '10.0.8.22',
      timestamp: pastDays(1)
    }
  ];

  for (const a of auditEntries) {
    db.run(
      `INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), a.user_id, a.user_email, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.timestamp]
    );
  }

  console.log('Seeding completed successfully!');
  console.log('=====================================================');
  console.log('ADMINISTRATOR:');
  console.log('  Email: admin@psrs.go.ke | Password: Admin@2026');
  console.log('STAFF OFFICERS:');
  console.log('  Civil Registration: officer.civil@psrs.go.ke | Password: Staff@2026');
  console.log('  Immigration: officer.immig@psrs.go.ke | Password: Staff@2026');
  console.log('  DCI Police Clearance: officer.dci@psrs.go.ke | Password: Staff@2026');
  console.log('  Ministry of Lands: officer.lands@psrs.go.ke | Password: Staff@2026');
  console.log('  County Services: officer.county@psrs.go.ke | Password: Staff@2026');
  console.log('CITIZEN ACCOUNTS:');
  console.log('  Faith Wanjiku: citizen.wanjiku@example.ke | Password: Citizen@2026');
  console.log('  Brian Omondi: citizen.omondi@example.ke | Password: Citizen@2026');
  console.log('=====================================================');
}

// If run directly
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed().catch(err => {
    console.error('Seed execution failed:', err);
    process.exit(1);
  });
}
