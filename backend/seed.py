from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.institute import Settings
from app.models.user import User
from app.models.lead import Lead, LeadActivity
from app.models.report import WhatsAppReport
from app.models.document import Document
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def seed_db(force_recreate: bool = True):
    db: Session = SessionLocal()
    try:
        if force_recreate:
            print("Deleting existing database schemas for a clean seeding run...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
        else:
            # Ensure tables exist first
            Base.metadata.create_all(bind=engine)
            # Check if admin already exists to prevent duplicate seeding
            admin_exists = db.query(User).filter(User.email == "operations@futureedge.edu").first()
            if admin_exists:
                print("Database already seeded. Skipping safe seeding.")
                return
            print("Database is empty. Running safe seeding...")

        # 1. Seed global Settings for FutureEdge Education Services
        print("Seeding production organization settings...")
        settings_rec = Settings(
            name="FutureEdge Education Services",
            address="402-403, Cyber Heights, Vibhuti Khand, Gomti Nagar, Lucknow, UP - 226010",
            phone="+91 98765 43210",
            email="admissions@futureedge.edu.in",
            website="https://futureedge.edu.in",
            logo_url="https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&h=128&fit=crop", # Clean blue-white themed school photo
            custom_params={
                "morning_report_channel": "futureedge-admissions-chat",
                "acceptance_letter_signature": "Manav Singh, Operations Lead",
                "compliance_audit_frequency": "daily",
                "tagline": "Admissions, Career Guidance & Student Success"
            }
        )
        db.add(settings_rec)
        db.commit()
        db.refresh(settings_rec)
        
        # 2. Seed Team Members (1 Admin Operations Lead + 5 Staff)
        print("Seeding team member accounts...")
        # Admin Operations Lead
        manav_admin = User(
            email="operations@futureedge.edu",
            password_hash=get_password_hash("admin123"),
            first_name="Manav",
            last_name="Singh",
            role="admin",
            is_active=True
        )
        db.add(manav_admin)
        
        # Counsellors (Staff)
        priya_staff = User(
            email="counsellor@futureedge.edu",
            password_hash=get_password_hash("staff123"),
            first_name="Priya",
            last_name="Sharma",
            role="staff",
            is_active=True
        )
        db.add(priya_staff)
        
        # Team Members
        rahul_staff = User(
            email="rahul@futureedge.edu",
            password_hash=get_password_hash("staff123"),
            first_name="Rahul",
            last_name="Verma",
            role="staff",
            is_active=True
        )
        db.add(rahul_staff)
        
        # Team Members
        ananya_staff = User(
            email="ananya@futureedge.edu",
            password_hash=get_password_hash("staff123"),
            first_name="Ananya",
            last_name="Gupta",
            role="staff",
            is_active=True
        )
        db.add(ananya_staff)
        
        # Admissions Coordinator Team
        karan_staff = User(
            email="karan@futureedge.edu",
            password_hash=get_password_hash("staff123"),
            first_name="Karan",
            last_name="Mehta",
            role="staff",
            is_active=True
        )
        db.add(karan_staff)
        
        # Team Members
        neha_staff = User(
            email="neha@futureedge.edu",
            password_hash=get_password_hash("staff123"),
            first_name="Neha",
            last_name="Jain",
            role="staff",
            is_active=True
        )
        db.add(neha_staff)
        
        db.commit()
        db.refresh(manav_admin)
        db.refresh(priya_staff)
        db.refresh(rahul_staff)
        db.refresh(ananya_staff)
        db.refresh(karan_staff)
        db.refresh(neha_staff)

        # 3. Seed 15 Realistic Candidate Leads
        print("Seeding 15 realistic CRM leads...")
        leads_data = [
            # 1. Aarav Sharma (BCA, Website, Contacted, assigned to Priya Sharma)
            Lead(
                first_name="Aarav",
                last_name="Sharma",
                email="aarav.sharma@gmail.com",
                phone="+91 91234 56780",
                status="contacted",
                source="website",
                academic_interest="Grade 11 - Computer Science", # Represents BCA query
                notes="Interested in AI specialization. Requested fee structure. Follow-up scheduled Friday.",
                is_at_risk=False,
                assigned_to=priya_staff.id
            ),
            # 2. Riya Singh (B.Tech CSE, WhatsApp, Follow-Up Pending, assigned to Rahul Verma, At Risk)
            Lead(
                first_name="Riya",
                last_name="Singh",
                email="riya.singh@gmail.com",
                phone="+91 92345 67891",
                status="new", # follow-up pending / new
                source="whatsapp",
                academic_interest="Grade 11 - Science & Math", # Represents B.Tech CSE
                notes="Parent requested scholarship information. Flagged due to fee concerns.",
                is_at_risk=True,
                risk_reason="Parent concerned about tuition fee affordability. Requested installment options. No response recorded in 72 hours.",
                assigned_to=rahul_staff.id
            ),
            # 3. Kabir Mehta (Data Science Bootcamp, Facebook, Admitted, assigned to Karan Mehta)
            Lead(
                first_name="Kabir",
                last_name="Mehta",
                email="kabir.mehta@gmail.com",
                phone="+91 93456 78902",
                status="admitted",
                source="referral", # Facebook/referral
                academic_interest="Grade 12 - Advanced Physics", # Represents Data Science
                notes="Selected for Data Science intensive batch. Enrollment package confirmed.",
                is_at_risk=False,
                assigned_to=karan_staff.id
            ),
            # 4. Ananya Mishra (BBA, Website, New, unassigned)
            Lead(
                first_name="Ananya",
                last_name="Mishra",
                email="ananya.mishra@gmail.com",
                phone="+91 94567 89013",
                status="new",
                source="website",
                academic_interest="Grade 10 - Arts and Humanities", # Represents BBA query
                notes="Inquired about placements and top recruiters. Send placements brochure.",
                is_at_risk=False,
                assigned_to=None
            ),
            # 5. Rohan Goel (B.Tech CSE, Direct Walk-In, Admitted, assigned to Neha Jain)
            Lead(
                first_name="Rohan",
                last_name="Goel",
                email="rohan.goel@gmail.com",
                phone="+91 95678 90124",
                status="admitted",
                source="direct",
                academic_interest="Grade 11 - Science & Math", # B.Tech CSE
                notes="Admitted via merit scholarship. Confirmed first semester technology fee deposit ₹35,000 paid.",
                is_at_risk=False,
                assigned_to=neha_staff.id
            ),
            # 6. Dev Patel (BCA, Website, Contacted, assigned to Ananya Gupta)
            Lead(
                first_name="Dev",
                last_name="Patel",
                email="dev.patel@gmail.com",
                phone="+91 96789 01235",
                status="contacted",
                source="website",
                academic_interest="Grade 11 - Computer Science",
                notes="Inquired about hostel facilities and semester fee schedules. Priya following up.",
                is_at_risk=False,
                assigned_to=ananya_staff.id
            ),
            # 7. Priya Gupta (Data Science, WhatsApp Referral, contacted, assigned to Priya Sharma)
            Lead(
                first_name="Priya",
                last_name="Gupta",
                email="priya.gupta@gmail.com",
                phone="+91 97890 12346",
                status="contacted",
                source="referral",
                academic_interest="Grade 12 - Advanced Physics",
                notes="Student requested installment details for reserve seat booking fee.",
                is_at_risk=False,
                assigned_to=priya_staff.id
            ),
            # 8. Sai Kiran (BBA, Facebook, Lost, assigned to Rahul Verma)
            Lead(
                first_name="Sai",
                last_name="Kiran",
                email="sai.kiran@gmail.com",
                phone="+91 98901 23457",
                status="lost",
                source="referral", # Facebook
                academic_interest="Grade 10 - Arts and Humanities",
                notes="Decided to pursue family retail business instead of further studies. Account closed.",
                is_at_risk=False,
                assigned_to=rahul_staff.id
            ),
            # 9. Sneha Reddy (B.Tech CSE, Website, New, unassigned)
            Lead(
                first_name="Sneha",
                last_name="Reddy",
                email="sneha.reddy@gmail.com",
                phone="+91 99012 34568",
                status="new",
                source="website",
                academic_interest="Grade 11 - Science & Math",
                notes="Requested Class 12 board marks eligibility criteria and cutoffs.",
                is_at_risk=False,
                assigned_to=None
            ),
            # 10. Arjun Nair (BCA, Direct Walk-In, Contacted, assigned to Ananya Gupta)
            Lead(
                first_name="Arjun",
                last_name="Nair",
                email="arjun.nair@gmail.com",
                phone="+91 90123 45679",
                status="contacted",
                source="direct",
                academic_interest="Grade 11 - Computer Science",
                notes="Visisted Gomti Nagar branch. Interested in BCA Cloud Computing option. Parents requesting installment options.",
                is_at_risk=False,
                assigned_to=ananya_staff.id
            ),
            # 11. Ishaan Varma (Data Science, Website, contacted, assigned to Karan Mehta, At Risk)
            Lead(
                first_name="Ishaan",
                last_name="Varma",
                email="ishaan.varma@gmail.com",
                phone="+91 91234 67890",
                status="contacted",
                source="website",
                academic_interest="Grade 12 - Advanced Physics",
                notes="Parent requested B.Tech CSE scholarship documents. Re-contact required.",
                is_at_risk=True,
                risk_reason="Parent concerned about scholarship approvals. No reply to callbacks in 48 hours.",
                assigned_to=karan_staff.id
            ),
            # 12. Diya Malhotra (BBA, WhatsApp Referral, Admitted, assigned to Neha Jain)
            Lead(
                first_name="Diya",
                last_name="Malhotra",
                email="diya.malhotra@gmail.com",
                phone="+91 92345 78901",
                status="admitted",
                source="whatsapp",
                academic_interest="Grade 10 - Arts and Humanities",
                notes="Confirmed seat reservation fee ₹35,000 paid. Documents verified.",
                is_at_risk=False,
                assigned_to=neha_staff.id
            ),
            # 13. Vivaan Saxena (B.Tech CSE, Facebook, Lost, assigned to Rahul Verma)
            Lead(
                first_name="Vivaan",
                last_name="Saxena",
                email="vivaan.saxena@gmail.com",
                phone="+91 93456 89012",
                status="lost",
                source="referral",
                academic_interest="Grade 11 - Science & Math",
                notes="Dropped out of funnel due to family relocation to another state. Closed.",
                is_at_risk=False,
                assigned_to=rahul_staff.id
            ),
            # 14. Meera Iyer (BCA, Website, New, unassigned)
            Lead(
                first_name="Meera",
                last_name="Iyer",
                email="meera.iyer@gmail.com",
                phone="+91 94567 90123",
                status="new",
                source="website",
                academic_interest="Grade 11 - Computer Science",
                notes="Requested computer lab session details and infrastructure pictures.",
                is_at_risk=False,
                assigned_to=None
            ),
            # 15. Kiara Sen (BBA, Direct Walk-In, Contacted, assigned to Rahul Verma)
            Lead(
                first_name="Kiara",
                last_name="Sen",
                email="kiara.sen@gmail.com",
                phone="+91 95678 01234",
                status="contacted",
                source="direct",
                academic_interest="Grade 10 - Arts and Humanities",
                notes="Walk-in counseling completed by Rahul Verma. Student satisfied, will confirm booking.",
                is_at_risk=False,
                assigned_to=rahul_staff.id
            )
        ]
        
        for lead in leads_data:
            db.add(lead)
        db.commit()
        
        # Retrieve seeded leads to map their IDs
        aarav_lead = db.query(Lead).filter(Lead.first_name == "Aarav").first()
        riya_lead = db.query(Lead).filter(Lead.first_name == "Riya").first()
        kabir_lead = db.query(Lead).filter(Lead.first_name == "Kabir").first()
        rohan_lead = db.query(Lead).filter(Lead.first_name == "Rohan").first()
        ishaan_lead = db.query(Lead).filter(Lead.first_name == "Ishaan").first()
        diya_lead = db.query(Lead).filter(Lead.first_name == "Diya").first()
        kiara_lead = db.query(Lead).filter(Lead.first_name == "Kiara").first()

        # 4. Seed 10 CRM Notes & 8 Activity Logs (LeadActivity records)
        print("Seeding CRM notes and activity logs...")
        activities_data = [
            # Aarav
            LeadActivity(lead_id=aarav_lead.id, performed_by=priya_staff.id, activity_type="note", description="Interested in AI specialization. Requested details on semesters."),
            LeadActivity(lead_id=aarav_lead.id, performed_by=priya_staff.id, activity_type="call", description="Spoke with candidate. Sent fee brochures over email."),
            LeadActivity(lead_id=aarav_lead.id, performed_by=priya_staff.id, activity_type="status_change", description="Status changed from 'new' to 'contacted'."),
            # Riya
            LeadActivity(lead_id=riya_lead.id, performed_by=rahul_staff.id, activity_type="note", description="Parent inquired about installment schemes. High concern on tuition fee affordability."),
            LeadActivity(lead_id=riya_lead.id, performed_by=rahul_staff.id, activity_type="ai_summary", description="AI Audit from WhatsApp report: Flagged student as high risk. Reason: Parent concerned about tuition affordability and requested installments."),
            # Kabir
            LeadActivity(lead_id=kabir_lead.id, performed_by=karan_staff.id, activity_type="note", description="Selected for Data Science intensive batch. Seat reserved."),
            LeadActivity(lead_id=kabir_lead.id, performed_by=karan_staff.id, activity_type="document_generated", description="Generated administrative PDF: Acceptance Letter for recipient 'Kabir Mehta'."),
            LeadActivity(lead_id=kabir_lead.id, performed_by=karan_staff.id, activity_type="status_change", description="Status changed from 'new' to 'admitted'."),
            # Rohan
            LeadActivity(lead_id=rohan_lead.id, performed_by=neha_staff.id, activity_type="document_generated", description="Generated administrative PDF: Fee Receipt for recipient 'Rohan Goel' (₹35,000 paid)."),
            LeadActivity(lead_id=rohan_lead.id, performed_by=neha_staff.id, activity_type="status_change", description="Status changed from 'new' to 'admitted'."),
            # Ishaan
            LeadActivity(lead_id=ishaan_lead.id, performed_by=karan_staff.id, activity_type="note", description="Parent concerns about scholarship approvals. Seeking documents."),
            LeadActivity(lead_id=ishaan_lead.id, performed_by=karan_staff.id, activity_type="ai_summary", description="AI Audit: Parent unresponsive to calls. Potential lead drop danger.")
        ]
        
        for act in activities_data:
            db.add(act)
        db.commit()

        # 5. Seed 3 WhatsApp Report Files (completed reviews)
        print("Seeding WhatsApp counselor chat audit records...")
        whatsapp_data = [
            WhatsAppReport(
                uploaded_by=priya_staff.id,
                file_name="admissions_review_11_june.txt",
                file_size=1254,
                raw_content=(
                    "[11/06/2026, 10:15:30] Parent (Aarav Sharma): Namaste, Aarav is keen on the BCA course.\n"
                    "[11/06/2026, 10:17:15] Priya Sharma: Yes, we offer specializations in AI and Data Science.\n"
                    "[11/06/2026, 10:18:40] Parent (Aarav Sharma): Great. Can we pay the admission fees in three installments?\n"
                    "[11/06/2026, 10:20:00] Priya Sharma: Sure, we have installment schemes. I will send you the request documents."
                ),
                summary="Discussion between parent and counsellor Priya Sharma regarding admissions. The parent is inquiring about the BCA program fee structure and scholarship options based on Class 12 board marks.",
                status="completed",
                analysis_results={
                    "summary": "Parent and counsellor Priya Sharma discussing BCA admission and payment details.",
                    "sentiment_overall": "concerned",
                    "at_risk_students": [
                        {
                            "name": "Aarav Sharma",
                            "reason": "Parent inquiring about installment options for BCA admissions.",
                            "urgency_level": "concerned"
                        }
                    ],
                    "action_items": [
                        {
                            "task": "Mail installment authorization form to Aarav Sharma's parent.",
                            "assignee_role": "staff",
                            "due_date_estimation": "24 hours"
                        }
                    ]
                }
            ),
            WhatsAppReport(
                uploaded_by=rahul_staff.id,
                file_name="scholarship_followups_june.txt",
                file_size=2048,
                raw_content=(
                    "[10/06/2026, 11:30:10] Parent (Riya Singh): Hello, we got the brochure but the tuition fees are very high.\n"
                    "[10/06/2026, 11:32:00] Rahul Verma: We have scholarships for board scores above 85%.\n"
                    "[10/06/2026, 11:35:15] Parent (Riya Singh): Riya scored 91%. Can we get a waiver? If not, we might look at other local colleges.\n"
                    "[10/06/2026, 11:38:00] Rahul Verma: I will check with the management and get back."
                ),
                summary="Counsellor Rahul Verma following up on Riya Singh's B.Tech CSE scholarship request. Parent expressed concern on tuition fee affordability and relocation.",
                status="completed",
                analysis_results={
                    "summary": "Counsellor Rahul Verma in conversation regarding Riya Singh's scholarship score waiver.",
                    "sentiment_overall": "urgent",
                    "at_risk_students": [
                        {
                            "name": "Riya Singh",
                            "reason": "Parent concerned about tuition affordability. Threatening to opt for other colleges if scholarship is not approved.",
                            "urgency_level": "urgent"
                        }
                    ],
                    "action_items": [
                        {
                            "task": "Consult Operations Lead Manav Singh for Riya's board scholarship approval.",
                            "assignee_role": "admin",
                            "due_date_estimation": "12 hours"
                        }
                    ]
                }
            ),
            WhatsAppReport(
                uploaded_by=karan_staff.id,
                file_name="counsellor_activity_report.txt",
                file_size=980,
                raw_content=(
                    "[09/06/2026, 15:40:00] Parent (Ishaan Varma): We missed the call yesterday.\n"
                    "[09/06/2026, 15:42:00] Karan Mehta: No problem, let's schedule counseling tomorrow.\n"
                ),
                summary="Counselling follow-up coordination. Parent requested reschedule.",
                status="completed",
                analysis_results={
                    "summary": "Counselor coordination for Ishaan Varma reschedule.",
                    "sentiment_overall": "neutral",
                    "at_risk_students": [
                        {
                            "name": "Ishaan Varma",
                            "reason": "Parent unresponsive to callback requests over the last 48 hours.",
                            "urgency_level": "concerned"
                        }
                    ],
                    "action_items": [
                        {
                            "task": "Re-schedule admissions interview call with Ishaan Varma's parent.",
                            "assignee_role": "staff",
                            "due_date_estimation": "2 days"
                        }
                    ]
                }
            )
        ]
        
        for rep in whatsapp_data:
            db.add(rep)
        db.commit()

        # 6. Seed 5 Document Generation Records (PDF Generation Log)
        print("Seeding document logs...")
        docs_data = [
            Document(
                generated_by=priya_staff.id,
                lead_id=aarav_lead.id,
                document_type="acceptance_letter",
                recipient_name="Aarav Sharma",
                recipient_email="aarav.sharma@gmail.com",
                data_payload={
                    "recipient_name": "Aarav Sharma",
                    "academic_interest": "Bachelor of Computer Applications (BCA)",
                    "admission_date": "2026-09-01",
                    "signature": "Manav Singh, Operations Lead"
                }
            ),
            Document(
                generated_by=karan_staff.id,
                lead_id=kabir_lead.id,
                document_type="acceptance_letter",
                recipient_name="Kabir Mehta",
                recipient_email="kabir.mehta@gmail.com",
                data_payload={
                    "recipient_name": "Kabir Mehta",
                    "academic_interest": "Data Science Certification Bootcamp",
                    "admission_date": "2026-07-15",
                    "signature": "Manav Singh, Operations Lead"
                }
            ),
            Document(
                generated_by=neha_staff.id,
                lead_id=rohan_lead.id,
                document_type="fee_receipt",
                recipient_name="Rohan Goel",
                recipient_email="rohan.goel@gmail.com",
                data_payload={
                    "recipient_name": "Rohan Goel",
                    "receipt_number": "FE-2026-001",
                    "amount": "35000.00",
                    "payment_method": "UPI (Google Pay)",
                    "details": "BCA Program Semester Fee Installment"
                }
            ),
            Document(
                generated_by=neha_staff.id,
                lead_id=diya_lead.id,
                document_type="fee_receipt",
                recipient_name="Diya Malhotra",
                recipient_email="diya.malhotra@gmail.com",
                data_payload={
                    "recipient_name": "Diya Malhotra",
                    "receipt_number": "FE-2026-002",
                    "amount": "35000.00",
                    "payment_method": "Net Banking",
                    "details": "BBA Program Seat Reservation Fee"
                }
            ),
            Document(
                generated_by=karan_staff.id,
                lead_id=ishaan_lead.id,
                document_type="compliance_notice",
                recipient_name="Ishaan Varma",
                recipient_email="ishaan.varma@gmail.com",
                data_payload={
                    "recipient_name": "Ishaan Varma",
                    "violation_details": "Pending Class 12 board marksheet submission and transfer certificates.",
                    "due_date": "2026-06-25"
                }
            ),
            Document(
                generated_by=priya_staff.id,
                lead_id=rohan_lead.id,
                document_type="report_card",
                recipient_name="Rohan Goel",
                recipient_email="rohan.goel@gmail.com",
                data_payload={
                    "recipient_name": "Rohan Goel",
                    "academic_interest": "Grade 11 - Science & Math",
                    "grades": {
                        "Mathematics": "A",
                        "Physics": "A-",
                        "Chemistry": "B+",
                        "English": "A",
                        "History": "B"
                    }
                }
            )
        ]
        
        for d_log in docs_data:
            db.add(d_log)
        db.commit()

        print("FutureEdge database seeded successfully with production demo records!")
        
    except Exception as e:
        print(f"Error seeding FutureEdge database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
