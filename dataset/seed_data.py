"""Seed the database with sample leads and company notes."""

import sys
sys.path.insert(0, ".")

from app.database import SessionLocal
from app.models import Lead

SAMPLE_LEADS = [
    {
        "company_name": "NovaTech Solutions",
        "industry": "Enterprise Software",
        "contact_person": "Arjun Mehta",
        "email": "arjun.mehta@novatech.io",
        "phone": "+1 415 555 0142",
        "website": "https://novatech.io",
        "employee_count": "250-500",
        "location": "San Francisco, USA",
        "technology_stack": "Python, React, AWS, PostgreSQL, Kubernetes",
        "description": "NovaTech builds workflow automation tools for mid-market companies. They recently closed a Series B and are scaling their engineering team. Currently evaluating vendors for a new data pipeline integration layer.",
        "status": "Qualified",
    },
    {
        "company_name": "GreenLeaf Logistics",
        "industry": "Supply Chain & Logistics",
        "contact_person": "Priya Sharma",
        "email": "priya@greenleaflogistics.com",
        "phone": "+44 20 7946 0958",
        "website": "https://greenleaflogistics.com",
        "employee_count": "1000-2500",
        "location": "London, UK",
        "technology_stack": "Java, Angular, Azure, Oracle DB",
        "description": "GreenLeaf operates last-mile delivery networks across Europe. They struggle with manual route optimisation and are looking to automate dispatch scheduling. Their current system is a legacy Java monolith they want to modernise.",
        "status": "Contacted",
    },
    {
        "company_name": "Meridian Health Group",
        "industry": "Healthcare Technology",
        "contact_person": "Dr. Sarah Chen",
        "email": "s.chen@meridianhealth.org",
        "phone": "+1 212 555 0198",
        "website": "https://meridianhealth.org",
        "employee_count": "500-1000",
        "location": "New York, USA",
        "technology_stack": "C#, .NET, Azure, SQL Server, HL7 FHIR",
        "description": "Meridian runs a network of outpatient clinics and needs a patient engagement platform. They want appointment scheduling, telehealth, and EHR integration. Compliance with HIPAA is non-negotiable. Budget approved for Q1.",
        "status": "Proposal",
    },
    {
        "company_name": "Atlas Financial Services",
        "industry": "Fintech",
        "contact_person": "James Okafor",
        "email": "j.okafor@atlasfs.com",
        "phone": "+1 646 555 0177",
        "website": "https://atlasfs.com",
        "employee_count": "50-100",
        "location": "Lagos, Nigeria",
        "technology_stack": "Node.js, React Native, MongoDB, AWS",
        "description": "Atlas is a fast-growing mobile payments startup targeting underbanked populations in West Africa. They need fraud detection, KYC automation, and a real-time transaction dashboard. Recently received seed funding of $4M.",
        "status": "New",
    },
    {
        "company_name": "Polaris Manufacturing",
        "industry": "Industrial Manufacturing",
        "contact_person": "Hans Gruber",
        "email": "hans.gruber@polaris-mfg.de",
        "phone": "+49 89 555 0234",
        "website": "https://polaris-mfg.de",
        "employee_count": "2500-5000",
        "location": "Munich, Germany",
        "technology_stack": "SAP, Siemens MindSphere, Python, MQTT",
        "description": "Polaris produces precision components for the automotive industry. They are investing in IoT sensors across their factory floor and need a predictive maintenance platform. Current downtime costs them an estimated €2M per quarter.",
        "status": "Qualified",
    },
    {
        "company_name": "BrightPath Education",
        "industry": "EdTech",
        "contact_person": "Maria Lopez",
        "email": "maria@brightpath.edu",
        "phone": "+1 310 555 0163",
        "website": "https://brightpath.edu",
        "employee_count": "100-250",
        "location": "Los Angeles, USA",
        "technology_stack": "Django, Vue.js, GCP, Redis",
        "description": "BrightPath offers online learning for K-12 students across Latin America. They need AI-powered adaptive learning features and better analytics for teachers. They currently serve 50,000 active students and are growing 30% month-over-month.",
        "status": "New",
    },
    {
        "company_name": "Coral Reef Hospitality",
        "industry": "Hospitality & Travel",
        "contact_person": "Anika Patel",
        "email": "anika@coralreefhotels.com",
        "phone": "+91 22 555 0421",
        "website": "https://coralreefhotels.com",
        "employee_count": "500-1000",
        "location": "Mumbai, India",
        "technology_stack": "PHP, Laravel, MySQL, Stripe",
        "description": "Coral Reef manages 35 boutique hotels across Southeast Asia. They need a unified booking engine, revenue management system, and guest experience app. Currently using five different disconnected systems for reservations.",
        "status": "Contacted",
    },
    {
        "company_name": "Sentinel Cybersecurity",
        "industry": "Cybersecurity",
        "contact_person": "Viktor Petrov",
        "email": "v.petrov@sentinel-sec.com",
        "phone": "+972 3 555 0388",
        "website": "https://sentinel-sec.com",
        "employee_count": "100-250",
        "location": "Tel Aviv, Israel",
        "technology_stack": "Go, Rust, Elasticsearch, Kafka, Terraform",
        "description": "Sentinel provides managed SOC services for mid-market companies. They want to build an AI-driven threat detection engine that can reduce false positives by 60%. Their analysts currently handle 2,000+ alerts daily.",
        "status": "Won",
    },
    {
        "company_name": "TerraVerde Agriculture",
        "industry": "AgriTech",
        "contact_person": "João Silva",
        "email": "joao@terraverde.ag",
        "phone": "+55 11 555 0299",
        "website": "https://terraverde.ag",
        "employee_count": "50-100",
        "location": "São Paulo, Brazil",
        "technology_stack": "Python, TensorFlow, AWS IoT, PostgreSQL",
        "description": "TerraVerde uses satellite imagery and soil sensors to advise large-scale farms on irrigation and fertiliser use. They want to expand their ML models to predict crop disease and need a mobile app for field workers. Backed by a major agribusiness conglomerate.",
        "status": "New",
    },
    {
        "company_name": "Quantum Retail Group",
        "industry": "Retail & E-commerce",
        "contact_person": "Emily Zhang",
        "email": "emily.zhang@quantumretail.co",
        "phone": "+86 21 555 0512",
        "website": "https://quantumretail.co",
        "employee_count": "1000-2500",
        "location": "Shanghai, China",
        "technology_stack": "Java, Spring Boot, React, Alibaba Cloud, Redis",
        "description": "Quantum operates 200+ retail stores and a fast-growing e-commerce platform. They need a unified inventory management system, demand forecasting, and personalised marketing automation. Last year's revenue was $180M with 15% YoY growth.",
        "status": "Lost",
    },
]


def seed():
    db = SessionLocal()
    try:
        added = 0
        for lead_data in SAMPLE_LEADS:
            existing = (
                db.query(Lead)
                .filter(Lead.company_name == lead_data["company_name"])
                .first()
            )
            if existing:
                print(f"  Skipped (exists): {lead_data['company_name']}")
                continue
            db.add(Lead(**lead_data))
            added += 1
            print(f"  Added: {lead_data['company_name']}")
        db.commit()
        print(f"\nDone — {added} leads seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
