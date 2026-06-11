import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from app.core.database import SessionLocal
from app.models.institute import Settings

def format_pdf_date(date_val) -> str:
    """
    Standardizes dates into the DD MMM YYYY format (e.g. 11 Jun 2026).
    """
    if not date_val:
        return ""
    if isinstance(date_val, datetime):
        return date_val.strftime("%d %b %Y")
    try:
        # Parse ISO date string
        dt = datetime.strptime(date_val.split("T")[0], "%Y-%m-%d")
        return dt.strftime("%d %b %Y")
    except Exception:
        return str(date_val)

def generate_pdf_document(doc_type: str, variables: dict, institute_name: str = "FutureEdge Education Services", ref_number: str = None) -> bytes:
    """
    Generates a stylized PDF document of the specified type using ReportLab.
    Returns the PDF content as a raw byte array.
    """
    buffer = io.BytesIO()
    
    # 0. Fetch Settings dynamically for branding/contact parameters
    db = SessionLocal()
    settings_rec = db.query(Settings).first()
    db.close()
    
    if settings_rec:
        institute_name = settings_rec.name
        
    ref_number = ref_number or f"FE-{doc_type[:3].upper()}-TEMP"
    
    # Setup document geometry (standard letter size with 0.75 in margin)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom color palette (matching the EduOps Navy & Electric blue style for prints)
    primary_color = colors.HexColor("#0B192C") # Deep Navy
    secondary_color = colors.HexColor("#008DDA") # Electric Blue
    text_color = colors.HexColor("#1E293B") # Charcoal
    light_bg = colors.HexColor("#F8FAFC") # Off white
    border_color = colors.HexColor("#E2E8F0") # Slate border
    
    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=secondary_color,
        spaceAfter=24
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=16,
        textColor=text_color,
        spaceAfter=12
    )
    
    bold_body_style = ParagraphStyle(
        'DocBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_color
    )
    
    footer_style = ParagraphStyle(
        'DocFooter',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#94A3B8"),
        alignment=1, # Centered
        spaceBefore=20
    )
    
    pdf_logo_style = ParagraphStyle(
        'PdfLogo',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.white,
        alignment=1 # Center
    )
    
    story = []
    
    # 1. Header banner (Institute Branding & Reference ID)
    right_header_text = f"<b>{format_pdf_date(datetime.now())}</b><br/>Ref: {ref_number}"
    
    header_data = [
        [
            Paragraph("<b>FE</b>", pdf_logo_style),
            "",
            Paragraph(f"<b>{institute_name.upper()}</b>", ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=13, leading=15, textColor=primary_color)),
            Paragraph(right_header_text, ParagraphStyle('H2', fontName='Helvetica', fontSize=9, leading=12, textColor=colors.HexColor("#64748B"), alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[0.4 * inch, 0.15 * inch, 3.45 * inch, 3.0 * inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), secondary_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,0), 'CENTER'),
        ('TOPPADDING', (0,0), (0,0), 6),
        ('BOTTOMPADDING', (0,0), (0,0), 6),
        ('BOTTOMPADDING', (2,0), (-1,-1), 10),
    ]))
    story.append(header_table)
    
    # Thin divider line
    divider = Table([[""]], colWidths=[7.0 * inch])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1, secondary_color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 20),
    ]))
    story.append(divider)
    story.append(Spacer(1, 10))
    
    # 2. Render content based on document type
    if doc_type == "acceptance_letter":
        recipient = variables.get("recipient_name", "Prospective Student")
        program = variables.get("academic_interest", "Selected Program")
        date_str = format_pdf_date(variables.get("admission_date"))
        
        # Signatory Settings Integration
        sig_default = settings_rec.custom_params.get("acceptance_letter_signature") if (settings_rec and settings_rec.custom_params) else "Manav Singh, Operations Lead"
        sig = variables.get("signature") or sig_default
        
        story.append(Paragraph("LETTER OF ADMISSION", title_style))
        story.append(Paragraph("Official Offer of Enrollment", subtitle_style))
        story.append(Spacer(1, 15))
        
        story.append(Paragraph(f"To,<br/><b>{recipient}</b>", body_style))
        story.append(Spacer(1, 10))
        
        letter_content = f"""
        We are pleased to inform you that you have been offered admission to <b>{institute_name}</b> for the academic term starting on <b>{date_str}</b>.
        Your application was reviewed thoroughly, and we are excited about the academic talent and character you will bring to our student body.
        <br/><br/>
        You have been accepted into the following program: <b>{program}</b>.
        <br/><br/>
        Please review the enrollment package attached to finalize your registration details, secure your financial arrangements, and confirm your seat within 14 calendar days of receiving this notice.
        If you have any questions or require additional guidance, our operations suite is ready to support you.
        <br/><br/>
        Welcome to our educational community! We look forward to your contributions.
        """
        story.append(Paragraph(letter_content, body_style))
        story.append(Spacer(1, 25))
        
        story.append(Paragraph("Sincerely,", body_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"<b>{sig}</b>", bold_body_style))
        story.append(Paragraph(institute_name, body_style))
        
    elif doc_type == "fee_receipt":
        recipient = variables.get("recipient_name", "Payer Name")
        receipt_num = ref_number
        amount = variables.get("amount", "0.00")
        method = variables.get("payment_method", "Bank Transfer")
        details = variables.get("details", "Tuition Fee deposit")
        
        story.append(Paragraph("OFFICIAL FEE RECEIPT", title_style))
        story.append(Paragraph(f"Receipt No: {receipt_num}", subtitle_style))
        story.append(Spacer(1, 15))
        
        # Details metadata table
        meta_data = [
            [Paragraph("<b>Payer Details:</b>", cell_style), Paragraph("<b>Payment Details:</b>", cell_style)],
            [Paragraph(recipient, cell_style), Paragraph(f"Amount Paid: ₹{amount}", cell_style)],
            [Paragraph(institute_name, cell_style), Paragraph(f"Payment Method: {method}", cell_style)],
            [Paragraph("", cell_style), Paragraph(f"Transaction Time: {format_pdf_date(datetime.now())} {datetime.now().strftime('%H:%M')}", cell_style)]
        ]
        meta_table = Table(meta_data, colWidths=[3.5 * inch, 3.5 * inch])
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,0), (-1,-1), light_bg),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))
        
        # Line items table
        items_data = [
            [Paragraph("Description", header_style), Paragraph("Quantity", header_style), Paragraph("Unit Price", header_style), Paragraph("Total", header_style)],
            [Paragraph(details, cell_style), Paragraph("1", cell_style), Paragraph(f"₹{amount}", cell_style), Paragraph(f"₹{amount}", cell_style)],
            [Paragraph("", cell_style), Paragraph("", cell_style), Paragraph("<b>Net Received:</b>", cell_style), Paragraph(f"<b>₹{amount}</b>", cell_style)]
        ]
        items_table = Table(items_data, colWidths=[3.5 * inch, 1.0 * inch, 1.25 * inch, 1.25 * inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,1), 0.5, border_color),
            ('BOX', (2,2), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 25))
        story.append(Paragraph("Thank you for your payment. This document acts as a valid proof of deposit.", body_style))
 
    elif doc_type == "report_card":
        recipient = variables.get("recipient_name", "Student Name")
        program = variables.get("academic_interest", "Grade 10")
        grades = variables.get("grades", {"Mathematics": "A", "Physics": "A-", "Chemistry": "B+", "English": "A", "History": "B"})
        
        story.append(Paragraph("ACADEMIC REPORT CARD", title_style))
        story.append(Paragraph(f"Enrollment Program: {program}", subtitle_style))
        story.append(Spacer(1, 15))
        
        story.append(Paragraph(f"Student Name: <b>{recipient}</b>", body_style))
        story.append(Spacer(1, 10))
        
        # Grades table
        grades_rows = [[Paragraph("Subject", header_style), Paragraph("Mark / Grade", header_style), Paragraph("Assessment", header_style)]]
        
        for subj, gr in grades.items():
            desc = "Excellent" if "A" in gr else "Good" if "B" in gr else "Satisfactory"
            grades_rows.append([
                Paragraph(subj, cell_style),
                Paragraph(gr, ParagraphStyle('Gr', parent=cell_style, fontName='Helvetica-Bold', alignment=1)),
                Paragraph(desc, cell_style)
            ])
            
        grades_table = Table(grades_rows, colWidths=[3.0 * inch, 2.0 * inch, 2.0 * inch])
        grades_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(grades_table)
        story.append(Spacer(1, 20))
        story.append(Paragraph("<b>Dean's Assessment:</b> Student has demonstrated excellent performance and consistent engagement with classroom projects.", body_style))
 
    elif doc_type == "compliance_notice":
        recipient = variables.get("recipient_name", "Parent / Student")
        violation = variables.get("violation_details", "Outstanding document submission or fee balances.")
        due_date = format_pdf_date(variables.get("due_date"))
        
        story.append(Paragraph("OFFICIAL COMPLIANCE NOTICE", title_style))
        story.append(Paragraph("Action Required immediately", subtitle_style))
        story.append(Spacer(1, 15))
        
        story.append(Paragraph(f"Dear <b>{recipient}</b>,", body_style))
        
        notice_content = f"""
        This letter serves as an official notice from the administrative offices of <b>{institute_name}</b> regarding a pending compliance requirement on your account.
        <br/><br/>
        <b>Pending Action Required:</b><br/>
        {violation}
        <br/><br/>
        To avoid administrative actions (including potential suspension of school portal access or enrollment delays), please complete this requirement by the following due date: <b>{due_date}</b>.
        <br/><br/>
        Please contact our compliance and operations suite immediately if you believe this notice was sent in error or if you require payment installment plans.
        """
        story.append(Paragraph(notice_content, body_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph("<b>Compliance Division Office</b>", bold_body_style))
        story.append(Paragraph(institute_name, body_style))
 
    # 3. Add footer audit text and dynamic contact info from settings
    story.append(Spacer(1, 40))
    story.append(Paragraph(f"Generated by FutureEdge Admissions Suite. Secured and certified copy for {institute_name}.", footer_style))
    if settings_rec:
        contact_text = f"{settings_rec.address}  |  Tel: {settings_rec.phone}  |  Email: {settings_rec.email}  |  Web: {settings_rec.website}"
        contact_style = ParagraphStyle('ContactFooter', parent=footer_style, fontSize=7, leading=9, textColor=colors.HexColor("#64748B"), spaceBefore=4)
        story.append(Paragraph(contact_text, contact_style))
        
    # Build the document
    doc.build(story)
    
    # Fetch content
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
