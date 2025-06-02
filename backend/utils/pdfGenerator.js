const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const _ = require("lodash");
const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");
const path = require('path');
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};
// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Number to Words Converters (Simplified versions)




// Enhanced Payroll Calculator
const TUNISIAN_RULES = {
  // Social security
  cnss: {
    employeeRate: 0.0968, // 9.68% (2025)
    employerRate: 0.1707, // 17.07% (2025)
    maxBase: 1500 // Max monthly salary subject to CNSS
  },

  // Income tax (IRPP) 2025
  irpp: {
    brackets: [
      { min: 0, max: 5000, rate: 0.00 },
      { min: 5000.01, max: 10000, rate: 0.15 },
      { min: 10000.01, max: 20000, rate: 0.25 },
      { min: 20000.01, max: 30000, rate: 0.30 },
      { min: 30000.01, max: 40000, rate: 0.33 },
      { min: 40000.01, max: 50000, rate: 0.36 },
      { min: 50000.01, max: 70000, rate: 0.38 },
      { min: 70000.01, max: Infinity, rate: 0.40 }
    ],
    professionalExpenses: 0.10, // 10%
    maxProfessionalExpenses: 2000 // Annual cap
  },

  // Family allowances (annual, for deduction)
  family: {
    maritalDeduction: 300, // annual
    perChildDeduction: 100, // annual per child
    maxChildren: 6
  },

  // Transport allowance
  transport: {
    exemptAmount: 20 // Non-taxable portion monthly
  },

  // Other social contributions
  contributions: {
    professionalTraining: 0.01, // 1%
    socialParticipation: 0.01, // 1%
    unemploymentInsuranceEmployee: 0.005, // 0.5% (new 2025)
    unemploymentInsuranceEmployer: 0.005  // 0.5% (new 2025)
  },
  // Employer
  employer: {
    accidentAtWork: 0.01 // 1%
  }
};

const calculatePayroll = (user) => {
  const baseSalary = _.get(user, 'professionalInfo.salary', 0);
  const transportAllowance = _.get(user, 'financialInfo.transportAllowance', 0);
  const isMarried = _.get(user, 'socialInfo.maritalStatus', '') === 'married';
  const childrenCount = Math.min(_.get(user, 'socialInfo.children', 0), TUNISIAN_RULES.family.maxChildren);

  // 1. Transport imposable
  const taxableTransport = Math.max(transportAllowance - TUNISIAN_RULES.transport.exemptAmount, 0);
  const nonTaxableTransport = transportAllowance - taxableTransport;

  // 2. Salaire brut imposable
  const taxableGross = baseSalary + taxableTransport;
  const totalGross = taxableGross + nonTaxableTransport;

  // 3. CNSS (plafonnée à 1500)
  const cnssBase = Math.min(taxableGross, TUNISIAN_RULES.cnss.maxBase);
  const cnssEmployee = parseFloat((cnssBase * TUNISIAN_RULES.cnss.employeeRate).toFixed(3));

  // 4. Unemployment insurance (employee)
  const unemploymentInsuranceEmployee = parseFloat((taxableGross * TUNISIAN_RULES.contributions.unemploymentInsuranceEmployee).toFixed(3));

  // 5. Annual calculations for deductions
  const annualBaseAfterCNSS = (taxableGross - cnssEmployee - unemploymentInsuranceEmployee) * 12;
  const maritalDeductionAnnual = isMarried ? TUNISIAN_RULES.family.maritalDeduction : 0;
  const childrenDeductionAnnual = childrenCount * TUNISIAN_RULES.family.perChildDeduction;
  const totalFamilyDeductionAnnual = maritalDeductionAnnual + childrenDeductionAnnual;
  const professionalExpensesAnnual = Math.min(
    annualBaseAfterCNSS * TUNISIAN_RULES.irpp.professionalExpenses,
    TUNISIAN_RULES.irpp.maxProfessionalExpenses
  );

  // 6. IRPP base
  const annualTaxableIncome = annualBaseAfterCNSS - professionalExpensesAnnual - totalFamilyDeductionAnnual;

  // 7. IRPP calculation (progressive)
  let incomeTaxAnnual = 0;
  for (const bracket of TUNISIAN_RULES.irpp.brackets) {
    if (annualTaxableIncome > bracket.min) {
      const taxableInBracket = Math.min(annualTaxableIncome, bracket.max) - bracket.min;
      incomeTaxAnnual += taxableInBracket * bracket.rate;
    }
  }
  const monthlyIRPP = parseFloat((incomeTaxAnnual / 12).toFixed(3));

  // 8. Other social contributions
  const professionalTraining = parseFloat((taxableGross * TUNISIAN_RULES.contributions.professionalTraining).toFixed(3));
  const socialParticipation = parseFloat((taxableGross * TUNISIAN_RULES.contributions.socialParticipation).toFixed(3));

  // 9. Total deductions
  const totalDeductions = cnssEmployee + unemploymentInsuranceEmployee + monthlyIRPP + professionalTraining + socialParticipation;

  // 10. Net salary
  const net = parseFloat((totalGross - totalDeductions).toFixed(3));

  // Employer contributions (for info)
  const cnssEmployer = parseFloat((cnssBase * TUNISIAN_RULES.cnss.employerRate).toFixed(3));
  const unemploymentInsuranceEmployer = parseFloat((taxableGross * TUNISIAN_RULES.contributions.unemploymentInsuranceEmployer).toFixed(3));
  const accidentAtWork = parseFloat((taxableGross * TUNISIAN_RULES.employer.accidentAtWork).toFixed(3));
  const totalEmployer = cnssEmployer + unemploymentInsuranceEmployer + accidentAtWork;

  return {
    gross: {
      taxable: parseFloat(taxableGross.toFixed(3)),
      nonTaxable: parseFloat(nonTaxableTransport.toFixed(3)),
      total: parseFloat(totalGross.toFixed(3))
    },
    deductions: {
      cnssEmployee,
      unemploymentInsuranceEmployee,
      irpp: monthlyIRPP,
      professionalTraining,
      socialParticipation,
      familyAnnual: totalFamilyDeductionAnnual,
      professionalExpensesAnnual
    },
    net,
    employerContributions: {
      cnssEmployer,
      unemploymentInsuranceEmployer,
      accidentAtWork,
      total: parseFloat(totalEmployer.toFixed(3))
    }
  };
};


const calculatePayrollAnnuel = (user) => {
  const monthly = calculatePayroll(user);

  return {
    gross: {
      taxable: monthly.gross.taxable * 12,
      nonTaxable: monthly.gross.nonTaxable * 12,
      total: monthly.gross.total * 12
    },
    deductions: {
      cnssEmployee: monthly.deductions.cnssEmployee * 12,
      irpp: monthly.deductions.irpp * 12,
      css: monthly.deductions.css * 12,
      professionalTraining: monthly.deductions.professionalTraining * 12,
      socialParticipation: monthly.deductions.socialParticipation * 12,
      familyAnnual: monthly.deductions.familyAnnual,
      professionalExpensesAnnual: monthly.deductions.professionalExpensesAnnual
    },
    net: monthly.net * 12
  };
};


const generateFichePaiAnnuel = async (user, request, annee,rh) => {
  try {
    if (!user.professionalInfo?.salary || !user.financialInfo?.CNSS) {
      throw new Error('Informations professionnelles incomplètes');
    }

    const payrollData = calculatePayrollAnnuel(user);
    
    // Calculate employer contributions
    const employerCNSS = (user.professionalInfo.salary * 0.2218 * 12).toFixed(3);
    const totalPatronal = (parseFloat(payrollData.deductions.cnssEmployee) + parseFloat(employerCNSS)).toFixed(3);

    const docDefinition = {
      pageMargins: [20, 120, 20, 60],
      header: {
        columns: [
          { 
            image: 'data:image/jpeg;base64,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',
            width: 80,
            margin: [20, 20, 0, 0]
          },
          {
            stack: [
              { text: process.env.COMPANY_NAME, style: 'companyHeader' },
              { text: 'RELEVÉ ANNUEL DE RÉMUNÉRATION', style: 'documentTitle' },
              { 
                text: [
                  `Affiliation CNSS: ${process.env.COMPANY_CNSS}`,
                  `\nAnnée : ${annee} | Code APE: ${process.env.COMPANY_APE}`
                ],
                style: 'companyInfo'
              }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        // Employee Information Section
        {
          columns: [
            {
              stack: [
                { text: `Matricule : ${user._id || 'N/A'}`, style: 'employeeInfo' },
                { text: `CIN : ${user.cin ? user.cin.toString().replace(/(\d{4})(\d{4})/, '****$2') : 'N/A'}`, style: 'employeeInfo' },
                { text: `CNSS : ${user.financialInfo.CNSS.toString().replace(/(\d{3})(\d{5})/, '***$2')}`, style: 'employeeInfo' }
              ]
            },
            {
              stack: [
                { text: `Poste : ${user.professionalInfo.position || 'N/A'}`, style: 'employeeInfo' },
                { text: `Departemtn : ${user.professionalInfo.department || 'N/A'}`, style: 'employeeInfo' },
                { text: `Situation familiale : ${user.socialInfo.maritalStatus || 'N/A'}`, style: 'employeeInfo' }
              ]
            }
          ],
          margin: [0, 0, 0, 15]
        },

        // Earnings Breakdown
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'ÉLÉMENTS DE RÉMUNÉRATION', style: 'sectionHeader', colSpan: 3 }, {}, {},
              ],
              [
                { text: 'Salaire de base', style: 'itemLabel' },
                { text: 'Montant annuel', style: 'itemValue' },
                { text: `${(user.professionalInfo.salary * 12).toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Prime de transport', style: 'itemLabel' },
                { text: 'Montant annuel', style: 'itemValue' },
                { text: `${user.financialInfo.transportAllowance.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Total brut imposable', style: 'totalLabel' },
                { text: 'Total brut', style: 'totalLabel' },
                { text: `${(payrollData.gross.total || 0 *12).toFixed(3)} TND`, style: 'totalValue' }
              ]
            ]
          }
        },

        // Deductions Section
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'COTISATIONS SOCIALES', style: 'sectionHeader', colSpan: 3 }, {}, {},
              ],
              [
                { text: 'CNSS employé (9.18%)', style: 'itemLabel' },
                { text: 'Montant annuel', style: 'itemValue' },
                { text: `${payrollData.deductions.cnssEmployee.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'IRPP progressif', style: 'itemLabel' },
                { text: 'Montant annuel', style: 'itemValue' },
                { text: `${payrollData.deductions.irpp.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Total déductions', style: 'totalLabel' },
                { text: 'Total retenues', style: 'totalLabel' },
                { text: `${(payrollData.deductions.cnssEmployee + payrollData.deductions.irpp).toFixed(3)} TND`, style: 'totalValue' }
              ]
            ],
            margin: [0, 10]
          }
        },

        // Employer Contributions
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'CONTRIBUTIONS PATRONALES', style: 'sectionHeader', colSpan: 3 }, {}, {},
              ],
              [
                { text: 'CNSS employeur (16.57%)', style: 'itemLabel' },
                { text: 'Montant annuel', style: 'itemValue' },
                { text: `${employerCNSS} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Formation professionnelle (1%)', style: 'itemLabel' },
                { text: 'Montant annuel', style: 'itemValue' },
                { text: `${(user.professionalInfo.salary * 0.01 * 12).toFixed(3)} TND`, style: 'itemValue' }
              ]
            ],
            margin: [0, 10]
          }
        },

        // Net Calculation
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'NET À PAYER', style: 'netHeader' },
                { text: `${payrollData.net.toFixed(3)} TND`, style: 'netValue' }
              ]
            ],
            margin: [0, 20]
          }
        },

        // Legal Section
        ,

        // Signature Section
        {
          columns: [
            {
              stack: [
                { text: 'Direction des Ressources Humaines', style: 'signatureTitle' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                { image: `${rh.signature}`, width: 300, height: 140 },
                { text: process.env.COMPANY_NAME, style: 'companyStamp' }

              ],
              width: '50%'
            },
            {
              stack: [
                { text: 'Signature salarié\n', style: 'signatureLabel' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                { image: `${user.signature}`, width: 300, height: 140 },
                { text: 'Reçu pour solde de tout compte', style: 'employeeStamp' }
              ],
              width: '50%',
              alignment: 'left'
              
            }
          ]
        }
      ],
      styles: {
        companyHeader: {
          fontSize: 16,
          bold: true,
          color: '#2c3e50'
        },
        documentTitle: {
          fontSize: 18,
          bold: true,
          color: '#1a237e',
          margin: [0, 5]
        },
        signatureTitle: {
          fontSize: 12,
          bold: true,
          color: '#1a237e',
          alignment: 'left'
        },
        sectionHeader: {
          fillColor: '#1a237e',
          color: 'white',
          bold: true,
          fontSize: 12,
          margin: [0, 5]
        },
        itemLabel: {
          fontSize: 10,
          color: '#444',
          margin: [0, 3]
        },
        itemValue: {
          fontSize: 10,
          bold: true,
          color: '#1a237e',
          alignment: 'right'
        },
        totalLabel: {
          fontSize: 11,
          bold: true,
          color: '#2c3e50',
          margin: [0, 5]
        },
        totalValue: {
          fontSize: 11,
          bold: true,
          color: '#1a237e',
          alignment: 'right'
        },
        netHeader: {
          fontSize: 14,
          bold: true,
          color: '#1a237e'
        },
        netValue: {
          fontSize: 16,
          bold: true,
          color: '#1a237e',
          alignment: 'right'
        },
        legalText: {
          fontSize: 9,
          color: '#666'
        },
        legalTextBold: {
          fontSize: 9,
          bold: true,
          color: '#444'
        },
        legalTextSmall: {
          fontSize: 8,
          color: '#666',
          italics: true
        },
        signatureLabel: {
          fontSize: 10,
          color: '#444',
          alignment: 'left'
        },
        companyStamp: {
          fontSize: 9,
          color: '#666',
          italics: true
        },
        employeeStamp: {
          fontSize: 9,
          color: '#666',
          italics: true
        }
      },
      footer: {
        text: `Document généré électroniquement - Valide sans signature manuscrite (Art. 84 Code du Travail Tunisien)\n${process.env.COMPANY_ADDRESS} - Tél: ${process.env.COMPANY_PHONE}`,
        alignment: 'center',
        fontSize: 8,
        color: '#666666',
        margin: [20, 10]
      }
    };

    const pdfBuffer = await new Promise((resolve, reject) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer(buffer => resolve(buffer));
    });

    const mailOptions = {
      from: `"Ressources Humaines - ${process.env.COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to: user.email,
      bcc: process.env.HR_EMAIL,
      subject: `Relevé annuel de rémunération ${annee} - ${user.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto;">
          <div style="background: #1a237e; padding: 20px; color: white;">
            <h2 style="margin: 0;">Votre relevé annuel ${annee}</h2>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Madame/Monsieur ${user.lastName},</p>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #1a237e;">Synthèse annuelle</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Total brut:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${payrollData.gross.total.toFixed(3)} TND</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">Total cotisations:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${(payrollData.deductions.cnssEmployee + payrollData.deductions.incomeTax).toFixed(3)} TND</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Net à payer:</strong></td>
                  <td style="padding: 8px;"><strong>${payrollData.net.toFixed(3)} TND</strong></td>
                </tr>
              </table>
            </div>

            <p>Votre document officiel est disponible en pièce jointe au format PDF.</p>

            <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="font-size: 0.9em; color: #6c757d;">
                Service des Ressources Humaines<br>
                ${process.env.COMPANY_NAME}<br>
                ${process.env.COMPANY_ADDRESS}<br>
                Tél: ${process.env.COMPANY_PHONE}
              </p>
            </footer>
          </div>
        </div>
      `,
      attachments: [{
        filename: `Releve_Annuel_${annee}_${user.lastName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      status: 'success',
      annee: annee,
      netAnnual: payrollData.net,
      pdfGenerated: true
    };

  } catch (error) {
    console.error('Erreur génération relevé annuel:', error);
    throw new Error(`Échec de génération: ${error.message}`);
  }
};

// Main Payslip Generation Function
const generateFichePaiMensuel = async (user, demande,rh) => {
  try {
    // Validate required professional info
    if (!user.professionalInfo?.salary || !user.financialInfo?.CNSS) {
      throw new Error('Informations professionnelles incomplètes');
    }

    // Calculate monthly payroll
    const payrollData = calculatePayroll(user);
    
    // Calculate employer contributions
    const employerCNSS = (user.professionalInfo.salary * 0.2218).toFixed(3);
    const totalPatronal = (parseFloat(payrollData.deductions.cnssEmployee) + parseFloat(employerCNSS)).toFixed(3);

    const docDefinition = {
      pageMargins: [20, 120, 20, 60],
      header: {
        columns: [
          { 
            image: 'data:image/jpeg;base64,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',
            width: 80,
            margin: [20, 20, 0, 0]
          },
          {
            stack: [
              { text: process.env.COMPANY_NAME, style: 'companyHeader' },
              { text: 'BULLETIN DE PAIE MENSUEL', style: 'documentTitle' },
              { 
                text: [
                  `Affiliation CNSS: ${process.env.COMPANY_CNSS}`,
                  `\nPériode : ${demande.mois} ${demande.annee} | Code APE: ${process.env.COMPANY_APE}`
                ],
                style: 'companyInfo'
              }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        // Employee Information Section
        {
          columns: [
            {
              stack: [
                { text: `Matricule : ${user._id || 'N/A'}`, style: 'employeeInfo' },
                { text: `CIN : ${user.cin ? user.cin.toString().replace(/(\d{4})(\d{4})/, '****$2') : 'N/A'}`, style: 'employeeInfo' },
                { text: `CNSS : ${user.financialInfo.CNSS.toString().replace(/(\d{3})(\d{5})/, '***$2')}`, style: 'employeeInfo' }
              ]
            },
            {
              stack: [
                { text: `Poste : ${user.professionalInfo.position || 'N/A'}`, style: 'employeeInfo' },
                { text: `Department : ${user.professionalInfo.department || 'N/A'}`, style: 'employeeInfo' },
                { text: `Situation familiale : ${user.socialInfo.maritalStatus || 'N/A'}`, style: 'employeeInfo' }
              ]
            }
          ],
          margin: [0, 0, 0, 15]
        },

        // Earnings Breakdown
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'ÉLÉMENTS DE RÉMUNÉRATION', style: 'sectionHeader', colSpan: 3 }, {}, {},
              ],
              [
                { text: 'Salaire de base', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${user.professionalInfo.salary.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Prime de transport', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${user.financialInfo.transportAllowance.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Total brut imposable', style: 'totalLabel' },
                { text: 'Total brut', style: 'totalLabel' },
                { text: `${payrollData.gross.total.toFixed(3)} TND`, style: 'totalValue' }
              ]
            ]
          }
        },

        // Employee Deductions
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'RETENUES SALARIALES', style: 'sectionHeader', colSpan: 3 }, {}, {},
              ],
              [
                { text: 'CNSS employé (9.18%)', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${payrollData.deductions.cnssEmployee.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'IRPP progressif', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${payrollData.deductions.irpp.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Formation professionnelle (1%)', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${payrollData.deductions.professionalTraining.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Participation sociale (1%)', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${payrollData.deductions.socialParticipation.toFixed(3)} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Total retenues', style: 'totalLabel' },
                { text: 'Total déductions', style: 'totalLabel' },
                { text: `${(payrollData.deductions.cnssEmployee + payrollData.deductions.irpp).toFixed(3)} TND`, style: 'totalValue' }
              ]
            ],
            margin: [0, 10]
          }
        },

        // Employer Contributions
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'CONTRIBUTIONS PATRONALES', style: 'sectionHeader', colSpan: 3 }, {}, {},
              ],
              [
                { text: 'CNSS employeur (22.18%)', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${employerCNSS} TND`, style: 'itemValue' }
              ],
              [
                { text: 'Accident de travail (1%)', style: 'itemLabel' },
                { text: 'Montant mensuel', style: 'itemValue' },
                { text: `${(user.professionalInfo.salary * 0.01).toFixed(3)} TND`, style: 'itemValue' }
              ]
            ],
            margin: [0, 10]
          }
        },

        // Net Calculation
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'NET À PAYER', style: 'netHeader' },
                { text: `${payrollData.net.toFixed(3)} TND`, style: 'netValue' }
              ]
            ],
            margin: [0, 20]
          }
        },

        // Legal Section
    

        // Signature Section
        {
          columns: [
            {
              stack: [
                { text: 'Cachet et signature employeur\n', style: 'signatureLabel' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                { image: `${rh.signature}`, width: 300, height: 140 },
                { text: process.env.COMPANY_NAME, style: 'companyStamp' }
              ],
              width: '50%',
              alignment: 'left' // Ajout de l'alignement à gauche
            },
            {
              stack: [
                { text: 'Signature salarié\n', style: 'signatureLabel' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                { image: `${user.signature}`, width: 300, height: 140 },
                { text: 'Reçu pour solde de tout compte', style: 'employeeStamp' }
              ],
              width: '50%',
              alignment: 'left' // Ajout de l'alignement à gauche
            }
          ],
          margin: [20, 0] // Ajout d'une marge à gauche de 20
        }
      ],
      styles: {
        companyHeader: {
          fontSize: 16,
          bold: true,
          color: '#2c3e50'
        },
        documentTitle: {
          fontSize: 18,
          bold: true,
          color: '#1a237e',
          margin: [0, 5]
        },
        sectionHeader: {
          fillColor: '#1a237e',
          color: 'white',
          bold: true,
          fontSize: 12,
          margin: [0, 5]
        },
        itemLabel: {
          fontSize: 10,
          color: '#444',
          margin: [0, 3]
        },
        itemValue: {
          fontSize: 10,
          bold: true,
          color: '#1a237e',
          alignment: 'right'
        },
        totalLabel: {
          fontSize: 11,
          bold: true,
          color: '#2c3e50',
          margin: [0, 5]
        },
        totalValue: {
          fontSize: 11,
          bold: true,
          color: '#1a237e',
          alignment: 'right'
        },
        netHeader: {
          fontSize: 14,
          bold: true,
          color: '#1a237e'
        },
        netValue: {
          fontSize: 16,
          bold: true,
          color: '#1a237e',
          alignment: 'right'
        },
        legalText: {
          fontSize: 9,
          color: '#666'
        },
        legalTextBold: {
          fontSize: 9,
          bold: true,
          color: '#444'
        },
        legalTextSmall: {
          fontSize: 8,
          color: '#666',
          italics: true
        },
        signatureLabel: {
          fontSize: 10,
          color: '#444',
          alignment: 'left'        },
        companyStamp: {
          fontSize: 9,
          color: '#666',
          italics: true
        },
        employeeStamp: {
          fontSize: 9,
          color: '#666',
          italics: true
        }
      },
      footer: {
        text: `Document généré électroniquement - Valide sans signature manuscrite (Art. 84 Code du Travail Tunisien)\n${process.env.COMPANY_ADDRESS} - Tél: ${process.env.COMPANY_PHONE}`,
        alignment: 'center',
        fontSize: 8,
        color: '#666666',
        margin: [20, 10]
      }
    };

    // PDF generation and email logic
    const pdfBuffer = await new Promise((resolve, reject) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer(resolve);
    });

    const mailOptions = {
      from: `"Service Paie - ${process.env.COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Fiche de paie - ${demande.mois} ${demande.annee}`,
      html: generateEmailTemplate(user, demande, payrollData),
      attachments: [{
        filename: `Fiche-Paie-${demande.mois}-${demande.annee}.pdf`,
        content: pdfBuffer
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      status: 'success',
      periode: `${demande.mois} ${demande.annee}`,
      netSalary: payrollData.net,
      pdfGenerated: true
    };

  } catch (error) {
    console.error('Erreur génération fiche mensuelle:', error);
    throw new Error(`Échec de génération: ${error.message}`);
  }
};

// Helper function for email template
const generateEmailTemplate = (user, demande, payrollData) => `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 20px auto;">
    <div style="border-bottom: 2px solid #1a237e; padding-bottom: 15px; margin-bottom: 25px;">
      <h2 style="color: #1a237e; margin: 0;">Votre fiche de paie ${demande.mois} ${demande.annee}</h2>
    </div>
    
    <p>Madame/Monsieur ${user.lastName},</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
      <h3 style="color: #1a237e; margin-top: 0;">Récapitulatif</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px;">Net à payer :</td>
          <td style="padding: 8px; font-weight: bold;">${payrollData.net.toFixed(3)} TND</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Date de paiement :</td>
          <td style="padding: 8px;">${new Date().toLocaleDateString('fr-TN')}</td>
        </tr>
      </table>
    </div>

    <p style="margin-top: 25px;">Votre document officiel est disponible en pièce jointe au format PDF.</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="font-size: 0.9em; color: #666;">
        Service des Ressources Humaines<br>
        ${process.env.COMPANY_NAME}<br>
        ${process.env.COMPANY_ADDRESS}<br>
        Tél: ${process.env.COMPANY_PHONE}
      </p>
    </div>
  </div>
`;


const generateAttestationTravail = async (user, request,rh) => {
  try {
    if (!user.professionalInfo || !user.cin) {
      throw new Error('Informations professionnelles incomplètes');
    }

    // Prepare contract type text based on contract type
    const contractTypeText = user.financialInfo?.contractType === 'CDD' 
      ? `dans le cadre d'un contrat à durée déterminée jusqu'au ${new Date(user.financialInfo.contractEndDate).toLocaleDateString('fr-FR')}`
      : "dans le cadre d'un contrat à durée indéterminée";

    const docDefinition = {
      pageMargins: [40, 130, 40, 60],
      header: {
        columns: [
           { 
            image: 'data:image/jpeg;base64,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',
            width: 80,
            margin: [20, 20, 0, 0]
          },
          { 
            stack: [
              { text: process.env.COMPANY_NAME || 'Nom Entreprise', style: 'companyName' },
              { text: process.env.COMPANY_ADDRESS || 'Adresse Entreprise', style: 'companyInfo' },
              { text: `Tél: ${process.env.COMPANY_PHONE || 'xx xxx xxx'}`, style: 'companyInfo' },
              { text: `Email: ${process.env.COMPANY_EMAIL || 'contact@company.com'}`, style: 'companyInfo' }
            ],
            width: '*',
            alignment: 'left',
            margin: [40, 20, 0, 0]
          }
        ]
      },
      content: [
        {
          text: 'ATTESTATION DE TRAVAIL',
          style: 'documentTitle',
          margin: [0, 20, 0, 20]
        },
        {
          text: `Ref: ATT/${new Date().getFullYear()}/${user._id.toString().slice(-4)}`,
          style: 'reference',
          margin: [0, 0, 0, 20]
        },
        {
          text: 'Je soussigné(e), Directeur des Ressources Humaines de la société ' + 
                (process.env.COMPANY_NAME || 'notre entreprise') + ', atteste par la présente que :',
          style: 'mainText',
          margin: [0, 0, 0, 20]
        },
        {
          text: [
            `Monsieur/Madame ${user.firstName} ${user.lastName}, `,
            `titulaire de la Carte d'Identité Nationale numéro ${user.cin}, `,
            `inscrit(e) à la Caisse Nationale de Sécurité Sociale sous le numéro ${user.financialInfo?.CNSS || 'N/A'}, `,
            'est employé(e) au sein de notre société.'
          ].join(''),
          style: 'mainText',
          margin: [0, 0, 0, 15]
        },
        {
          text: [
            `L'intéressé(e) occupe actuellement le poste de ${user.professionalInfo?.position || 'N/A'} `,
            `au sein du département ${user.professionalInfo?.department || 'N/A'}, `,
            `et ce depuis le ${new Date(user.professionalInfo?.hiringDate).toLocaleDateString('fr-FR')} `,
            contractTypeText + '.'
          ].join(''),
          style: 'mainText',
          margin: [0, 0, 0, 15]
        },
        {
          text: 'Dans le cadre de ses fonctions, l\'intéressé(e) est chargé(e) des responsabilités suivantes :',
          style: 'mainText',
          margin: [0, 0, 0, 10]
        },
        {
          text: user.professionalInfo?.jobDescription?.responsibilities?.map(resp => `• ${resp}`).join('\n') || 'N/A',
          style: 'responsibilities',
          margin: [20, 0, 0, 15]
        },
        {
          text: `Fait à ${process.env.COMPANY_CITY || 'Tunis'}, le ${new Date().toLocaleDateString('fr-FR')}`,
          style: 'dateText',
          margin: [0, 20]
        },
        {
          columns: [
            {
              stack: [
                { text: 'Direction des Ressources Humaines', style: 'signatureTitle' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                { image: `${rh.signature}`, width: 220, height: 100 },
                { text: process.env.COMPANY_NAME, style: 'companyStamp' }

              ],
              width: '*',
              alignment: 'left'
            }
          
          ],  
          margin: [20, 40]
        }
      ],
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          color: '#1a237e'
        },
        companyInfo: {
          fontSize: 10,
          color: '#666666',
          margin: [0, 2]
        },
        documentTitle: {
          fontSize: 24,
          bold: true,
          color: '#1a237e',
          alignment: 'center'
        },
        reference: {
          fontSize: 11,
          color: '#666666',
          alignment: 'right'
        },
        mainText: {
          fontSize: 12,
          alignment: 'justify',
          lineHeight: 1.4
        },
        responsibilities: {
          fontSize: 11,
          color: '#34495e',
          lineHeight: 1.4
        },
        purposeText: {
          fontSize: 11,
          italic: true,
          color: '#2c3e50'
        },
        dateText: {
          fontSize: 11,
          alignment: 'right',
          margin: [0, 30]
        },
        signatureTitle: {
          fontSize: 12,
          bold: true,
          color: '#1a237e',
          alignment: 'left'
        },
        signatureText: {
          fontSize: 11,
          color: '#666666',
          margin: [0, 5]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      },
      footer: {
        text: [
          { text: `${process.env.COMPANY_NAME || 'Company Name'} - `, bold: true },
          { text: `${process.env.COMPANY_ADDRESS || 'Company Address'} - Tél: ${process.env.COMPANY_PHONE || 'xx xxx xxx'}` }
        ],
        alignment: 'center',
        fontSize: 8,
        color: '#666666',
        margin: [40, 0]
      }
    };

    // Rest of the code remains the same...
    const pdfDoc = pdfMake.createPdf(docDefinition);
    
    const pdfBuffer = await new Promise((resolve) => {
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      });
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME} - RH" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Attestation de Travail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto;">
          <h2 style="color: #1a237e;">Votre attestation de travail</h2>
          <p>Bonjour ${user.firstName} ${user.lastName},</p>
          <p>Suite à votre demande, vous trouverez ci-joint votre attestation de travail.</p>
          <p>Cordialement,<br>Service Ressources Humaines</p>
        </div>
      `,
      attachments: [{
        filename: `Attestation_Travail_${user.lastName}.pdf`,
        content: pdfBuffer
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      status: 'success',
      message: 'Attestation generated and sent successfully',
      pdfGenerated: true
    };

  } catch (error) {
    console.error('Erreur génération attestation:', error);
    throw new Error(`Échec de génération: ${error.message}`);
  }
};

const generateAttestationStage = async (user, request,rh) => {
  try {
    if (!user.professionalInfo || !user.cin) {
      throw new Error('Informations professionnelles incomplètes');
    }

    // Validate internship specific fields
    if (!user.financialInfo?.contractEndDate || !user.professionalInfo?.hiringDate) {
      throw new Error('Dates de stage manquantes');
    }

    // Prepare internship dates
    const startDate = new Date(user.professionalInfo.hiringDate).toLocaleDateString('fr-FR');
    const endDate = new Date(user.financialInfo.contractEndDate).toLocaleDateString('fr-FR');
    const responsibilities = Array.isArray(user.professionalInfo?.jobDescription?.responsibilities)
    ? user.professionalInfo.jobDescription.responsibilities
    : typeof user.professionalInfo?.jobDescription?.responsibilities === 'string'
      ? user.professionalInfo.jobDescription.responsibilities.split(',')
      : ['Stage pratique au sein du département'];
      const docDefinition = {
        pageMargins: [40, 130, 40, 60],
        header: {
          columns: [
            { 
            image: 'data:image/jpeg;base64,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',
              width: 100,
              margin: [40, 20, 0, 0]
            },
            { 
              stack: [
                { text: process.env.COMPANY_NAME || 'Nom Entreprise', style: 'companyName' },
                { text: process.env.COMPANY_ADDRESS || 'Adresse Entreprise', style: 'companyInfo' },
                { text: `Matricule Fiscal: ${process.env.COMPANY_TAX_ID || 'xxxxxx/x'}`, style: 'companyInfo' },
                { text: `Tél: ${process.env.COMPANY_PHONE || 'xx xxx xxx'}`, style: 'companyInfo' }
              ],
              width: '*',
              alignment: 'right',
              margin: [0, 20, 40, 0]
            }
          ]
        },
        content: [
          {
            text: 'ATTESTATION DE STAGE',
            style: 'documentTitle',
            margin: [0, 40, 0, 30]
          },
          {
            text: `N° ${new Date().getFullYear()}-${user._id.toString().slice(-4)}/STG`,
            style: 'reference',
            margin: [0, 0, 0, 30]
          },
          {
            text: [
              `Je soussigné(e), ${process.env.HR_DIRECTOR || 'Directeur des Ressources Humaines'}, `,
              `agissant en qualité de ${process.env.HR_POSITION || 'DRH'} de la société ${process.env.COMPANY_NAME || 'notre entreprise'}, `,
              `certifie par la présente que Monsieur/Madame ${user.firstName} ${user.lastName}, `,
              `né(e) le ${new Date(user.personalInfo?.birthDate).toLocaleDateString('fr-FR') || 'N/A'}, `,
              `titulaire de la Carte d'Identité Nationale numéro ${user.cin}, `,
              `a effectué un stage au sein de notre entreprise durant la période du ${startDate} au ${endDate}.`
            ].join(''),
            style: 'mainText',
            margin: [0, 0, 0, 20]
          },
          {
            text: [
              `Ce stage s'est déroulé au sein du département ${user.professionalInfo?.department || 'N/A'} `,
              `sous l'encadrement de ${user.professionalInfo?.supervisor || 'notre équipe'}.`
            ].join(''),
            style: 'mainText',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Missions effectuées :',
            style: 'sectionTitle',
            margin: [0, 0, 0, 15]
          },
          {
            text: 'Au cours de ce stage, l\'intéressé(e) a été chargé(e) des missions suivantes :',
            style: 'mainText',
            margin: [0, 0, 0, 10]
          },
          {
            text: user.professionalInfo?.jobDescription?.responsibilities?.map(resp => `• ${resp}`).join('\n') || 'N/A',
            style: 'responsibilities',
            margin: [20, 0, 0, 15]
          },
          {
            text: 'Appréciation :',
            style: 'sectionTitle',
            margin: [0, 0, 0, 15]
          },
          {
            text: [
              'Durant cette période, l\'intéressé(e) a fait preuve de sérieux et de professionnalisme dans l\'accomplissement ',
              'des missions qui lui ont été confiées. Nous avons particulièrement apprécié son sens des responsabilités, ',
              'sa capacité d\'adaptation et d\'intégration au sein de notre équipe, ainsi que ses qualités relationnelles ',
              'et son esprit d\'initiative.'
            ].join(''),
            style: 'evaluation',
            margin: [0, 0, 0, 30]
          },
          
          {
            columns: [
              {
                text: `Fait à ${process.env.COMPANY_CITY || 'Tunis'}, le ${new Date().toLocaleDateString('fr-FR')}`,
                width: '*',
                style: 'signature'
              },
              {
                stack: [
                  { text: 'Direction des Ressources Humaines', style: 'signatureTitle' },
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                  { image: `${rh.signature}`, width: 150, height: 70 },
                  { text: process.env.COMPANY_NAME, style: 'companyStamp' }
  
                ],
                width: 'auto',
                alignment: 'right'
              }
            ]
          }
        ],
        styles: {
          documentTitle: {
            fontSize: 20,
            bold: true,
            alignment: 'center',
            color: '#1a237e'
          },
          companyName: {
            fontSize: 14,
            bold: true,
            color: '#1a237e'
          },
          companyInfo: {
            fontSize: 10,
            color: '#546e7a'
          },
          reference: {
            fontSize: 11,
            color: '#546e7a',
            alignment: 'right'
          },
          mainText: {
            fontSize: 12,
            lineHeight: 1.5,
            alignment: 'justify'
          },
          signatureTitle: {
            fontSize: 12,
            bold: true,
            color: '#1a237e',
            alignment: 'left'
          },
          sectionTitle: {
            fontSize: 13,
            bold: true,
            color: '#1a237e',
            margin: [0, 10, 0, 5]
          },
          missionsList: {
            fontSize: 11,
            lineHeight: 1.4
          },
          evaluation: {
            fontSize: 12,
            lineHeight: 1.5,
            color: '#2c3e50',
            alignment: 'justify'
          },
          purposeText: {
            fontSize: 12,
            lineHeight: 1.5,
            alignment: 'justify'
          },
          signature: {
            fontSize: 11,
            bold: true
          },
          signatureNote: {
            fontSize: 10,
            italics: true,
            color: '#546e7a'
          }
        }
      };

    // PDF generation and email sending (same as travail version)
    const pdfDoc = pdfMake.createPdf(docDefinition);
    
    const pdfBuffer = await new Promise((resolve) => {
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      });
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME} - RH" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Attestation de Stage',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto;">
          <h2 style="color: #1a237e;">Votre attestation de stage</h2>
          <p>Bonjour ${user.firstName} ${user.lastName},</p>
          <p>Suite à votre demande, vous trouverez ci-joint votre attestation de stage.</p>
          <p>Cordialement,<br>Service Ressources Humaines</p>
        </div>
      `,
      attachments: [{
        filename: `Attestation_Stage_${user.lastName}.pdf`,
        content: pdfBuffer
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      status: 'success',
      message: 'Attestation de stage générée avec succès',
      pdfGenerated: true
    };

  } catch (error) {
    console.error('Erreur génération attestation de stage:', error);
    throw new Error(`Échec de génération: ${error.message}`);
  }
};


module.exports = {generateFichePaiMensuel,generateFichePaiAnnuel,generateAttestationTravail,generateAttestationStage};