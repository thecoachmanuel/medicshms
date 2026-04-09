  const handlePrint = () => {
    const printContent = document.getElementById('report-container');
    if (!printContent) {
      toast.error('Clinical report buffer not ready');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Print window blocked by browser. Please allow popups.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Laboratory Report - ${requests[0]?.patient?.full_name || 'Patient'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            
            body { 
              font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; 
              padding: 0; 
              margin: 0; 
              color: #0f172a; 
              background: #f1f5f9;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 18mm;
              margin: 20px auto;
              background: white;
              box-sizing: border-box;
              position: relative;
              box-shadow: 0 0 40px rgba(0,0,0,0.05);
            }
            @page { size: A4; margin: 0; }
            @media print {
              body { background: white; }
              .page { margin: 0; box-shadow: none; width: 100%; min-height: 100%; padding: 12mm; }
            }

            /* Security Pattern Background */
            .page::before {
              content: "";
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background-image: radial-gradient(#e2e8f0 0.5px, transparent 0.5px);
              background-size: 20px 20px;
              opacity: 0.15;
              pointer-events: none;
            }

            /* Header Section */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              position: relative;
              z-index: 1;
            }
            .hospital-branding {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .hospital-logo {
              height: 56px;
              width: auto;
              object-fit: contain;
            }
            .branding-divider {
              width: 2px;
              height: 50px;
              background: ${settings.primary_color || '#4f46e5'}20;
            }
            .hospital-info h1 {
              font-size: 18px;
              font-weight: 900;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: -0.02em;
              color: #1e293b;
            }
            .hospital-info p {
              font-size: 10px;
              color: #64748b;
              margin: 2px 0;
              font-weight: 600;
            }

            .report-meta {
              text-align: right;
            }
            .accession-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 10px 15px;
              border-radius: 12px;
              display: inline-block;
            }
            .accession-label {
              font-size: 8px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              margin-bottom: 4px;
            }
            .accession-number {
              font-family: 'JetBrains Mono', monospace;
              font-size: 14px;
              font-weight: 700;
              color: ${settings.primary_color || '#1e293b'};
            }

            /* Patient Identity Card */
            .patient-card {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 24px;
              background: #f8fafc;
              padding: 24px;
              border-radius: 16px;
              margin-bottom: 40px;
              border: 1px solid #e2e8f0;
              position: relative;
            }
            .patient-card::after {
              content: "CONFIDENTIAL";
              position: absolute;
              bottom: 8px; right: 12px;
              font-size: 8px;
              font-weight: 900;
              color: #e2e8f0;
              letter-spacing: 0.2em;
            }
            .demo-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .demo-label {
              font-size: 8px;
              font-weight: 900;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .demo-value {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
            }
            .demo-value.highlight {
              color: ${settings.primary_color || '#4f46e5'};
              font-weight: 800;
            }

            /* Test Results Section */
            .test-entry {
              margin-bottom: 40px;
              position: relative;
            }
            .test-title {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
            }
            .test-title .index {
              background: #1e293b;
              color: white;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 900;
            }
            .test-title h3 {
              font-size: 14px;
              font-weight: 950;
              text-transform: uppercase;
              margin: 0;
              color: #1e293b;
              letter-spacing: 0.02em;
            }

            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0 8px;
              margin-bottom: 20px;
            }
            th {
              text-align: left;
              font-size: 9px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              padding: 0 12px 8px;
              border-bottom: 2px solid #f1f5f9;
            }
            td {
              padding: 12px;
              font-size: 11px;
              background: #fff;
              border-top: 1px solid #f1f5f9;
              border-bottom: 1px solid #f1f5f9;
            }
            td:first-child { border-left: 1px solid #f1f5f9; border-radius: 8px 0 0 8px; }
            td:last-child { border-right: 1px solid #f1f5f9; border-radius: 0 8px 8px 0; }
            
            .metric-name { font-weight: 700; color: #334155; }
            .metric-value { 
              font-family: 'JetBrains Mono', monospace;
              font-weight: 800; 
              font-size: 12px;
              color: #0f172a; 
            }
            .metric-unit { font-weight: 600; color: #64748b; font-size: 10px; }
            .metric-range { font-size: 9px; color: #94a3b8; font-style: italic; }
            
            .critical-row td { background: #fff1f2; border-color: #fecdd3; }
            .critical-row .metric-value { color: #e11d48; }

            .impressions {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              margin-top: 12px;
            }
            .impressions-label {
              font-size: 9px;
              font-weight: 900;
              color: #94a3b8;
              text-transform: uppercase;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .impressions-label::after {
              content: "";
              flex: 1;
              height: 1px;
              background: #f1f5f9;
            }
            .impressions-content {
              font-size: 10px;
              line-height: 1.6;
              color: #475569;
              white-space: pre-wrap;
            }

            /* Footer & Signatures */
            .footer {
              position: absolute;
              bottom: 18mm;
              left: 18mm;
              right: 18mm;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 32px;
              border-top: 1px solid #f1f5f9;
            }
            .qr-placeholder {
              width: 80px;
              height: 80px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 8px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .signature-area {
              display: flex;
              gap: 48px;
            }
            .signature-block {
              text-align: center;
              width: 160px;
            }
            .signature-line {
              height: 1px;
              background: #cbd5e1;
              margin-bottom: 8px;
            }
            .signature-label {
              font-size: 8px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .scientist-name {
              font-size: 10px;
              font-weight: 900;
              color: #1e293b;
              margin-top: 4px;
              text-transform: uppercase;
            }
            .watermark {
              position: fixed;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              font-weight: 950;
              color: rgba(241, 245, 249, 0.4);
              letter-spacing: -0.05em;
              pointer-events: none;
              text-transform: uppercase;
              z-index: -1;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const patient = requests[0]?.patient || {};

  const parseResults = (rawString: string): { metrics: Metric[], notes: string } => {
    if (!rawString) return { metrics: [], notes: '' };
    if (rawString.includes('METRIC_DATA:')) {
      try {
        const parts = rawString.split('METRIC_DATA:');
        const notes = parts[0].trim();
        const data = JSON.parse(parts[1]);
        if (Array.isArray(data)) return { metrics: data, notes };
        return { 
          metrics: Object.entries(data).map(([label, value]) => ({ label, value: String(value), unit: '', referenceRange: '' })),
          notes 
        };
      } catch (e) { return { metrics: [], notes: rawString }; }
    }
    return { metrics: [], notes: rawString };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-[#f8fafc] rounded-[3rem] w-full max-w-5xl shadow-[0_32px_128px_rgba(30,41,59,0.2)] overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300 max-h-[96vh] flex flex-col">
        
        {/* Modern Modal Header */}
        <div className="px-10 py-8 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
              <Microscope className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Report Intelligence</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Authenticated</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Diagnostic Reference • {requests.length} Test(s)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrint}
              disabled={loading}
              className={cn(
                "flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 active:scale-95 shadow-xl shadow-gray-200 cursor-pointer",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Printer className="w-5 h-5" />
              {loading ? 'Processing...' : 'Export Certificate'}
            </button>
            <button 
              onClick={onClose} 
              className="p-4 hover:bg-rose-50 rounded-2xl text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50">
          <div id="report-container" className="mx-auto">
            <div className="page" id="report-inner">
              <div className="watermark">Diagnostic Verified</div>
              
              <div className="header">
                <div className="hospital-branding">
                  {(settings.logo_url || settings.hospital_logo) ? (
                    <img src={settings.logo_url || settings.hospital_logo} alt="Logo" className="hospital-logo" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                      <Microscope className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="branding-divider"></div>
                  <div className="hospital-info">
                    <h1>{settings.hospital_name || 'Unity Medical Center'}</h1>
                    <p>{settings.address || 'Clinical Headquarters'}</p>
                    <p>{settings.contact_email || 'diagnostics@hospital.com'} • {settings.contact_phone || '+234 000 000 0000'}</p>
                  </div>
                </div>
                
                <div className="report-meta">
                  <div className="accession-box">
                    <div className="accession-label">Accession Number</div>
                    <div className="accession-number">
                      {(() => {
                        const testInitial = (requests[0]?.test_name || 'LAB').substring(0, 3).toUpperCase();
                        const uniqueId = requests[0]?.lab_number || requests[0]?.id.slice(-8).toUpperCase();
                        return uniqueId.startsWith(testInitial) ? uniqueId : `${testInitial}${uniqueId}`;
                      })()}
                    </div>
                  </div>
                  <div className="mt-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    REF: {new Date().getTime().toString(36).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="patient-card">
                <div className="demo-item">
                  <span className="demo-label">Patient Name</span>
                  <span className="demo-value uppercase">{patient.full_name || 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Identity ID</span>
                  <span className="demo-value">#{patient.patient_id || 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Age / Gender</span>
                  <span className="demo-value">{calculateAge(patient.date_of_birth)}Y / {patient.gender || 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Clinical Dept</span>
                  <span className="demo-value highlight uppercase">
                    {(Array.isArray(requests[0]?.handled_by_profile?.assignments) ? requests[0]?.handled_by_profile?.assignments[0] : requests[0]?.handled_by_profile?.assignments)?.unit?.name ||
                     (Array.isArray(requests[0]?.handled_by_profile?.staff_record) ? requests[0]?.handled_by_profile?.staff_record[0] : requests[0]?.handled_by_profile?.staff_record)?.dept?.name || 
                     requests[0]?.unit?.name || 
                     'Laboratory Department'}
                  </span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Referring Doctor</span>
                  <span className="demo-value uppercase">{requests[0]?.requested_by_name || requests[0]?.doctor?.profile?.name || 'SELF-REQUEST'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Sample Status</span>
                  <span className="demo-value">{requests[0]?.collected_at ? 'COLLECTED' : 'NOT RECORDED'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Collection Date</span>
                  <span className="demo-value">{requests[0]?.collected_at ? new Date(requests[0]?.collected_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Validation Date</span>
                  <span className="demo-value">{new Date(requests[0]?.completed_at || new Date()).toLocaleDateString()}</span>
                </div>
              </div>

              {requests.map((req, idx) => {
                const { metrics, notes } = parseResults(req.results);
                return (
                  <div key={req.id} className="test-entry">
                    <div className="test-title">
                      <div className="index">{idx + 1}</div>
                      <h3>{req.test_name}</h3>
                    </div>
                    {metrics.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Parameter Name</th>
                            <th style={{ width: '20%' }}>Result</th>
                            <th style={{ width: '15%' }}>Unit</th>
                            <th style={{ width: '25%' }}>Biological Ref Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m, mIdx) => (
                            <tr key={mIdx} className={cn(req.is_critical && mIdx === 0 && "critical-row")}>
                              <td className="metric-name">{m.label}</td>
                              <td className="metric-value">{m.value}</td>
                              <td className="metric-unit">{m.unit}</td>
                              <td className="metric-range">{m.referenceRange || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        Descriptive clinical findings provided below
                      </div>
                    )}
                    {notes && (
                      <div className="impressions">
                        <div className="impressions-label">Interpretations & Morphology</div>
                        <div className="impressions-content whitespace-pre-wrap">{notes}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="footer">
                <div className="qr-placeholder">
                  {/* Clean SVG QR Placeholder */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200" fill="currentColor">
                    <path d="M10,10 h30 v30 h-30 z M60,10 h30 v30 h-30 z M10,60 h30 v30 h-30 z M60,60 h10 v10 h-10 z M80,60 h10 v10 h-10 z M70,70 h10 v10 h-10 z M60,80 h10 v10 h-10 z M80,80 h10 v10 h-10 z" />
                    <rect x="15" y="15" width="20" height="20" fill="white" />
                    <rect x="18" y="18" width="14" height="14" fill="currentColor" />
                    <rect x="65" y="15" width="20" height="20" fill="white" />
                    <rect x="68" y="18" width="14" height="14" fill="currentColor" />
                    <rect x="15" y="65" width="20" height="20" fill="white" />
                    <rect x="18" y="68" width="14" height="14" fill="currentColor" />
                  </svg>
                </div>
                <div className="signature-area">
                  <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-label">Clinical Director</div>
                  </div>
                  <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-label">Authorized Scientist</div>
                    <div className="scientist-name">{requests[0]?.handled_by_profile?.name || 'Certified Pathologist'}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
