import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, FileSignature, Sparkles, Check } from 'lucide-react';
import {
  AbboudVehicle,
  AgencySettings,
  ClientRecord,
  ContractRecord,
  InvoicePaymentRecord,
  InvoiceRecord,
} from '../types/abboud';

interface AbboudPrintModalProps {
  mode: 'contract' | 'invoice';
  settings: AgencySettings;
  contract?: ContractRecord | null;
  invoice?: InvoiceRecord | null;
  client?: ClientRecord | null;
  vehicle?: AbboudVehicle | null;
  payments?: InvoicePaymentRecord[];
  allContracts?: ContractRecord[];
  allClients?: ClientRecord[];
  allVehicles?: AbboudVehicle[];
  allInvoices?: InvoiceRecord[];
  onClose: () => void;
}

// Convert integer amount into French words for "Arrête la présente facture à la somme de :"
function nombreEnLettresFr(n: number): string {
  if (isNaN(n) || n < 0) return '';
  const entier = Math.round(n);
  if (entier === 0) return 'Zéro';

  const unites = [
    '',
    'Un',
    'Deux',
    'Trois',
    'Quatre',
    'Cinq',
    'Six',
    'Sept',
    'Huit',
    'Neuf',
    'Dix',
    'Onze',
    'Douze',
    'Treize',
    'Quatorze',
    'Quinze',
    'Seize',
    'Dix-Sept',
    'Dix-Huit',
    'Dix-Neuf',
  ];
  const dizaines = [
    '',
    'Dix',
    'Vingt',
    'Trente',
    'Quarante',
    'Cinquante',
    'Soixante',
    'Soixante',
    'Quatre-Vingt',
    'Quatre-Vingt',
  ];

  const convertMoinsDeMille = (val: number): string => {
    let res = '';
    const cent = Math.floor(val / 100);
    const reste = val % 100;
    if (cent > 0) {
      res += cent === 1 ? 'Cent' : `${unites[cent]} Cent`;
    }
    if (reste > 0) {
      if (res) res += ' ';
      if (reste < 20) {
        res += unites[reste];
      } else {
        const d = Math.floor(reste / 10);
        const u = reste % 10;
        if (d === 7 || d === 9) {
          res += `${dizaines[d]}-${unites[10 + u]}`;
        } else {
          res += dizaines[d];
          if (u > 0) {
            res += u === 1 && d < 8 ? ' et Un' : `-${unites[u]}`;
          }
        }
      }
    }
    return res;
  };

  const milliers = Math.floor(entier / 1000);
  const resteMille = entier % 1000;
  const parts: string[] = [];
  if (milliers > 0) {
    parts.push(milliers === 1 ? 'Mille' : `${convertMoinsDeMille(milliers)} Mille`);
  }
  if (resteMille > 0) {
    parts.push(convertMoinsDeMille(resteMille));
  }
  return parts.join(' ');
}

function formatDateFr(isoOrDate: string): string {
  if (!isoOrDate) return '';
  const d = isoOrDate.slice(0, 10);
  const parts = d.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoOrDate;
}

function formatDateTimeFr(iso: string): string {
  if (!iso) return '';
  const [datePart, timePart] = iso.split('T');
  const d = formatDateFr(datePart);
  return timePart ? `${d} à ${timePart.slice(0, 5)}` : d;
}

export const AbboudPrintModal: React.FC<AbboudPrintModalProps> = ({
  mode: initialMode,
  contract,
  invoice,
  client,
  vehicle,
  payments = [],
  allContracts = [],
  allClients = [],
  allVehicles = [],
  allInvoices = [],
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<'contract' | 'invoice'>(initialMode);
  const [selectedContractId, setSelectedContractId] = useState<string>(contract?.id || '');

  // Lookup active entities
  const currentContract =
    allContracts.find((c) => c.id === selectedContractId) || contract || null;
  const currentInvoice =
    (currentContract && allInvoices.find((i) => i.contractId === currentContract.id)) ||
    invoice ||
    null;
  const currentClient =
    allClients.find(
      (c) => c.id === (currentContract?.clientId || currentInvoice?.clientId)
    ) ||
    client ||
    null;
  const currentVehicle =
    allVehicles.find((v) => v.id === currentContract?.vehicleId) || vehicle || null;

  // =========================================================================
  // AUTO-FILLED & LIVE-EDITABLE STATE FOR FACTURE OFFICIELLE
  // =========================================================================
  const [refFacture, setRefFacture] = useState('0002/2026');
  const [dateFacture, setDateFacture] = useState(formatDateFr(new Date().toISOString()));
  const [nomClientFacture, setNomClientFacture] = useState('');
  const [designationLigne1, setDesignationLigne1] = useState(
    'Location de Voiture SANS CHAUFFEUR.'
  );
  const [designationVehicule, setDesignationVehicule] = useState('');
  const [designationPeriode, setDesignationPeriode] = useState('');
  const [dureeJours, setDureeJours] = useState(1);
  const [prixUnitaireHT, setPrixUnitaireHT] = useState(250);
  const [appliquerTva20, setAppliquerTva20] = useState(true);
  const [autresMontant, setAutresMontant] = useState(0);
  const [sommeEnLettres, setSommeEnLettres] = useState('');
  const [modePaiementLabel, setModePaiementLabel] = useState('Espèces');
  const [chequeNum, setChequeNum] = useState('');
  const [effetNum, setEffetNum] = useState('');
  const [especesVal, setEspecesVal] = useState('Oui');

  // Extra invoice rows (rows 2, 3, 4 as on the physical paper form)
  const [extraRows, setExtraRows] = useState([
    { designation: '', duree: '', puHt: '', totalHt: '' },
    { designation: '', duree: '', puHt: '', totalHt: '' },
    { designation: '', duree: '', puHt: '', totalHt: '' },
  ]);

  // =========================================================================
  // AUTO-FILLED & LIVE-EDITABLE STATE FOR CONTRAT DE LOCATION OFFICIEL
  // =========================================================================
  const [numContratPaper, setNumContratPaper] = useState('0001548');
  const [dateContratPaper, setDateContratPaper] = useState(
    formatDateFr(new Date().toISOString())
  );
  // Locataire Principal
  const [locNom, setLocNom] = useState('');
  const [locPrenom, setLocPrenom] = useState('');
  const [locNaissance, setLocNaissance] = useState('');
  const [locTel, setLocTel] = useState('');
  const [locAdresse, setLocAdresse] = useState('');
  const [locCin, setLocCin] = useState('');
  const [locCinValable, setLocCinValable] = useState('');
  const [locPasseport, setLocPasseport] = useState('');
  const [locPasseportDelivre, setLocPasseportDelivre] = useState('');
  const [locPermis, setLocPermis] = useState('');
  const [locPermisDelivre, setLocPermisDelivre] = useState('');

  // 2ème Conducteur déclaré
  const [cond2Nom, setCond2Nom] = useState('');
  const [cond2Prenom, setCond2Prenom] = useState('');
  const [cond2Naissance, setCond2Naissance] = useState('');
  const [cond2Tel, setCond2Tel] = useState('');
  const [cond2Cin, setCond2Cin] = useState('');
  const [cond2Permis, setCond2Permis] = useState('');
  const [cond2PermisDelivre, setCond2PermisDelivre] = useState('');

  // Dates Départ / Retour / Prolongation
  const [ctrDepart, setCtrDepart] = useState('');
  const [ctrRetour, setCtrRetour] = useState('');
  const [ctrProlongation, setCtrProlongation] = useState('');
  const [ctrRenduLe, setCtrRenduLe] = useState('');

  // Véhicule en Location & État à la livraison
  const [vehMarqueModele, setVehMarqueModele] = useState('');
  const [vehImmat, setVehImmat] = useState('');
  const [vehCarburantType, setVehCarburantType] = useState<'Sans plomb' | 'Gasoil'>('Sans plomb');
  const [jaugeCarburant, setJaugeCarburant] = useState<'0' | '1/4' | '1/2' | '3/4' | '1'>('1');
  const [accPosteRadio, setAccPosteRadio] = useState(true);
  const [accRoueSecours, setAccRoueSecours] = useState(true);
  const [accGilet, setAccGilet] = useState(true);
  const [accExtincteur, setAccExtincteur] = useState(true);
  const [kmDepartPaper, setKmDepartPaper] = useState('');
  const [kmRetourPaper, setKmRetourPaper] = useState('');

  // Changement de véhicule
  const [chgMarqueModele, setChgMarqueModele] = useState('');
  const [chgImmat, setChgImmat] = useState('');
  const [chgDate, setChgDate] = useState('');

  // Facturation sur Contrat
  const [factAvance, setFactAvance] = useState(0);
  const [factProlongation, setFactProlongation] = useState('');
  const [factFranchise, setFactFranchise] = useState('');

  // Synchronize automatically whenever currentContract / currentClient / currentVehicle / currentInvoice changes
  useEffect(() => {
    const fullName = currentClient?.nomComplet || '';
    const nameParts = fullName.trim().split(/\s+/);
    const derivedNom = nameParts.length > 1 ? nameParts[0] : fullName;
    const derivedPrenom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    setLocNom(derivedNom);
    setLocPrenom(derivedPrenom);
    setLocTel(currentClient?.telephone || '');
    setLocAdresse(currentClient?.adresse || 'Kénitra');
    setLocCin(currentClient?.cinOuPasseport || '');
    setLocPermis(currentClient?.permisNumero || '');
    setLocPermisDelivre(currentClient?.permisDateDelivrance || '');

    const modName = currentVehicle?.modele || 'Dacia Sandero';
    const immat = currentVehicle?.immatriculation || 'À renseigner';
    setVehMarqueModele(modName);
    setVehImmat(immat);
    setVehCarburantType(currentVehicle?.carburant === 'Diesel' ? 'Gasoil' : 'Sans plomb');

    const nbJ = currentContract?.nbJours || 1;
    const pu = currentContract?.tarifJournalierConvenu || currentVehicle?.tarifJournalier || 250;
    const depStr = currentContract ? formatDateFr(currentContract.departPrevu) : formatDateFr(new Date().toISOString());
    const retStr = currentContract ? formatDateFr(currentContract.retourPrevu) : formatDateFr(new Date().toISOString());

    setNumContratPaper(
      currentContract?.numeroContrat.replace(/^CTR-\d+-/, '000') || '0001548'
    );
    setCtrDepart(currentContract ? formatDateTimeFr(currentContract.departPrevu) : depStr);
    setCtrRetour(currentContract ? formatDateTimeFr(currentContract.retourPrevu) : retStr);
    setCtrRenduLe(
      currentContract?.retourReel ? formatDateTimeFr(currentContract.retourReel) : ''
    );
    setKmDepartPaper(
      currentContract?.kmDepart !== null && currentContract?.kmDepart !== undefined
        ? String(currentContract.kmDepart)
        : currentVehicle?.kilometrage !== null && currentVehicle?.kilometrage !== undefined
        ? String(currentVehicle.kilometrage)
        : ''
    );
    setKmRetourPaper(
      currentContract?.kmRetour !== null && currentContract?.kmRetour !== undefined
        ? String(currentContract.kmRetour)
        : ''
    );

    // Invoice fields
    setRefFacture(
      currentInvoice?.numeroFacture
        ? currentInvoice.numeroFacture.replace('FAC-2026-', '') + '/2026'
        : '0002/2026'
    );
    setDateFacture(
      currentInvoice ? formatDateFr(currentInvoice.dateEmission) : formatDateFr(new Date().toISOString())
    );
    setNomClientFacture(fullName || 'Client');
    setDesignationVehicule(`${modName} ${immat}`);
    setDesignationPeriode(`Période : Du ${depStr} Au ${retStr}`);
    setDureeJours(nbJ);
    setPrixUnitaireHT(pu);
    setFactAvance(currentInvoice?.montantPayeAffecte || 0);
    setFactFranchise(
      currentContract?.cautionMontant ? `${currentContract.cautionMontant} DH` : ''
    );

    if (payments.length > 0) {
      const lastP = payments[payments.length - 1];
      setModePaiementLabel(lastP.modePaiement);
      setChequeNum(lastP.modePaiement === 'Chèque' ? lastP.referenceOperation : '');
      setEspecesVal(lastP.modePaiement === 'Espèces' ? `${lastP.montant} DH` : '');
    }
  }, [currentContract, currentInvoice, currentClient, currentVehicle, payments]);

  // Calculate Invoice Totals automatically
  const totalHT = Math.round(dureeJours * prixUnitaireHT * 100) / 100;
  const montantTVA = appliquerTva20 ? Math.round(totalHT * 0.2 * 100) / 100 : 0;
  const totalTTC = Math.round((totalHT + montantTVA + autresMontant) * 100) / 100;

  useEffect(() => {
    const words = nombreEnLettresFr(totalTTC);
    setSommeEnLettres(`${words} dirhams TTC`);
  }, [totalTTC]);

  // One-click helper to load the exact example from the user's uploaded photo
  const handleLoadPhotoExample = () => {
    setRefFacture('0002/2026');
    setDateFacture('14/09/2026');
    setNomClientFacture('وكيل اللائحة مصطفى ابراهيمي');
    setDesignationLigne1('Location de Voiture SANS CHAUFFEUR.');
    setDesignationVehicule('Dacia Sandero 25462-B-59');
    setDesignationPeriode('Période : Du 11/09/2026 Au 24/09/2026');
    setDureeJours(13);
    setPrixUnitaireHT(250);
    setAppliquerTva20(true);
    setAutresMontant(0);
    setSommeEnLettres('Trois Mille Neuf Cent dirhams TTC');

    // Also fill contract fields matching the photo
    setNumContratPaper('0001548');
    setLocNom('ابراهيمي');
    setLocPrenom('مصطفى');
    setVehMarqueModele('Dacia Sandero');
    setVehImmat('25462-B-59');
    setVehCarburantType('Sans plomb');
    setCtrDepart('11/09/2026 à 10:00');
    setCtrRetour('24/09/2026 à 10:00');
  };

  const resteAPayerContrat = Math.max(0, totalTTC - factAvance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-2xl print:max-h-none print:w-full print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        {/* ================================================================= */}
        {/* TOP CONTROL & AUTO-FILL BAR (HIDDEN WHEN PRINTING)                */}
        {/* ================================================================= */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveDoc('invoice')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition ${
                activeDoc === 'invoice'
                  ? 'bg-[#1E3A8A] text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Modèle Facture Officielle
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc('contract')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition ${
                activeDoc === 'contract'
                  ? 'bg-[#1E3A8A] text-white shadow'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileSignature className="h-4 w-4" />
              Modèle Contrat de Location Officiel
            </button>

            {allContracts.length > 0 && (
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="">-- Remplissage auto depuis un contrat --</option>
                {allContracts.map((c) => {
                  const cl = allClients.find((x) => x.id === c.clientId);
                  const vh = allVehicles.find((x) => x.id === c.vehicleId);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.numeroContrat} — {cl?.nomComplet || 'Client'} ({vh?.modele})
                    </option>
                  );
                })}
              </select>
            )}

            <button
              type="button"
              onClick={handleLoadPhotoExample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Charger l&apos;exemple Facture 0002/2026 (Dacia Sandero)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700"
            >
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* DOCUMENT 1 : MODÈLE OFFICIEL "FACTURE" ABBOUD CAR RENTALS SARL AU */}
        {/* ================================================================= */}
        {activeDoc === 'invoice' && (
          <div className="relative mx-auto max-w-[820px] overflow-hidden border border-slate-300 bg-white p-8 text-slate-900 shadow-sm print:border-none print:p-4 print:shadow-none">
            {/* Diagonal Watermark "LOCATION DE VOITURES" */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045] select-none">
              <span className="-rotate-45 text-6xl font-black tracking-[0.25em] text-slate-900">
                LOCATION DE VOITURES
              </span>
            </div>

            <div className="relative z-10">
              {/* Top Company Header */}
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight text-[#1E3A8A] sm:text-4xl">
                  ABBOUD CAR RENTALS SARL AU
                </h1>
                <div className="mt-1 flex items-center justify-between border-b-2 border-[#3B82F6] pb-1 text-sm font-bold text-[#1E3A8A]">
                  <span className="tracking-wide">LOCATION DE VOITURE</span>
                  <span className="text-base font-bold" dir="rtl">
                    تأجير السيارات
                  </span>
                </div>
              </div>

              {/* Centered "FACTURE" Box */}
              <div className="my-6 flex justify-center">
                <div className="border-2 border-[#93C5FD] bg-[#F5F3DF] px-16 py-2 shadow-inner">
                  <span className="text-xl font-extrabold tracking-[0.35em] text-slate-800">
                    FACTURE
                  </span>
                </div>
              </div>

              {/* Two Blue-Bordered Boxes: Left (Référence & Date) | Right (CLIENT) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="border-2 border-[#3B82F6] p-3 text-xs sm:col-span-5">
                  <div className="flex items-center justify-between gap-2 font-bold text-slate-800">
                    <span>Référence Facture :</span>
                    <input
                      type="text"
                      value={refFacture}
                      onChange={(e) => setRefFacture(e.target.value)}
                      className="w-32 border-b border-dashed border-slate-300 bg-transparent text-right font-mono text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none print:border-none"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 font-bold text-slate-800">
                    <span>Date Facture :</span>
                    <input
                      type="text"
                      value={dateFacture}
                      onChange={(e) => setDateFacture(e.target.value)}
                      className="w-32 border-b border-dashed border-slate-300 bg-transparent text-right font-mono text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none print:border-none"
                    />
                  </div>
                </div>

                <div className="flex items-center border-2 border-[#3B82F6] p-3 sm:col-span-7">
                  <span className="mr-2 text-xs font-extrabold uppercase text-slate-800">
                    CLIENT :
                  </span>
                  <input
                    type="text"
                    value={nomClientFacture}
                    onChange={(e) => setNomClientFacture(e.target.value)}
                    placeholder="Nom du client (FR / AR)"
                    className="w-full border-b border-dashed border-slate-300 bg-transparent text-center text-base font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none print:border-none"
                  />
                </div>
              </div>

              {/* Main 4-Column Invoice Table */}
              <div className="mt-6">
                <table className="w-full border-collapse border-2 border-slate-800 text-xs">
                  <thead>
                    <tr className="bg-[#DCE6F1] text-slate-900">
                      <th className="w-[54%] border-2 border-slate-800 py-2.5 text-center font-extrabold">
                        Désignation
                      </th>
                      <th className="w-[12%] border-2 border-slate-800 py-2.5 text-center font-extrabold">
                        Durée
                      </th>
                      <th className="w-[17%] border-2 border-slate-800 py-2.5 text-center font-extrabold">
                        Prix unitaire HT
                      </th>
                      <th className="w-[17%] border-2 border-slate-800 py-2.5 text-center font-extrabold">
                        Prix total HT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Primary Rental Line */}
                    <tr className="h-24 align-middle">
                      <td className="border-2 border-slate-800 p-2.5 text-center">
                        <input
                          type="text"
                          value={designationLigne1}
                          onChange={(e) => setDesignationLigne1(e.target.value)}
                          className="w-full bg-transparent text-center text-xs font-extrabold text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={designationVehicule}
                          onChange={(e) => setDesignationVehicule(e.target.value)}
                          className="mt-0.5 w-full bg-transparent text-center text-sm font-black text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={designationPeriode}
                          onChange={(e) => setDesignationPeriode(e.target.value)}
                          className="mt-0.5 w-full bg-transparent text-center text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </td>
                      <td className="border-2 border-slate-800 p-2 text-center font-mono text-sm font-extrabold">
                        <div className="inline-flex items-center justify-center">
                          <input
                            type="number"
                            min={1}
                            value={dureeJours}
                            onChange={(e) => setDureeJours(Math.max(1, Number(e.target.value)))}
                            className="w-12 bg-transparent text-right font-extrabold focus:outline-none"
                          />
                          <span>j</span>
                        </div>
                      </td>
                      <td className="border-2 border-slate-800 p-2 text-center font-mono text-sm font-extrabold">
                        <input
                          type="number"
                          step="0.01"
                          value={prixUnitaireHT}
                          onChange={(e) => setPrixUnitaireHT(Number(e.target.value))}
                          className="w-24 bg-transparent text-center font-extrabold focus:outline-none"
                        />
                      </td>
                      <td className="border-2 border-slate-800 p-2 text-center font-mono text-sm font-extrabold">
                        {totalHT.toFixed(2)}
                      </td>
                    </tr>

                    {/* 3 Additional Blank/Editable Rows matching the paper invoice */}
                    {extraRows.map((row, idx) => (
                      <tr key={idx} className="h-9">
                        <td className="border-2 border-slate-800 px-2">
                          <input
                            type="text"
                            value={row.designation}
                            onChange={(e) => {
                              const next = [...extraRows];
                              next[idx].designation = e.target.value;
                              setExtraRows(next);
                            }}
                            className="w-full bg-transparent text-center text-xs focus:outline-none"
                          />
                        </td>
                        <td className="border-2 border-slate-800 px-2">
                          <input
                            type="text"
                            value={row.duree}
                            onChange={(e) => {
                              const next = [...extraRows];
                              next[idx].duree = e.target.value;
                              setExtraRows(next);
                            }}
                            className="w-full bg-transparent text-center font-mono text-xs focus:outline-none"
                          />
                        </td>
                        <td className="border-2 border-slate-800 px-2">
                          <input
                            type="text"
                            value={row.puHt}
                            onChange={(e) => {
                              const next = [...extraRows];
                              next[idx].puHt = e.target.value;
                              setExtraRows(next);
                            }}
                            className="w-full bg-transparent text-center font-mono text-xs focus:outline-none"
                          />
                        </td>
                        <td className="border-2 border-slate-800 px-2">
                          <input
                            type="text"
                            value={row.totalHt}
                            onChange={(e) => {
                              const next = [...extraRows];
                              next[idx].totalHt = e.target.value;
                              setExtraRows(next);
                            }}
                            className="w-full bg-transparent text-center font-mono text-xs focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Section: Left (Somme en lettres & Mode de paiement) | Right (Totals HT, TVA 20%, TTC) */}
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-12">
                {/* Left Column */}
                <div className="sm:col-span-6">
                  <p className="text-xs font-extrabold text-slate-800">
                    Arrête la présente facture à la somme de :
                  </p>
                  <input
                    type="text"
                    value={sommeEnLettres}
                    onChange={(e) => setSommeEnLettres(e.target.value)}
                    className="mt-1 w-full border-b border-dashed border-slate-300 bg-transparent text-sm font-bold text-slate-900 focus:outline-none print:border-none"
                  />

                  <table className="mt-3 w-full border-collapse border-2 border-slate-800 text-center text-xs">
                    <thead>
                      <tr className="bg-[#DCE6F1] font-bold">
                        <th className="border-2 border-slate-800 p-1.5">
                          Mode De
                          <br />
                          Paiement
                        </th>
                        <th className="border-2 border-slate-800 p-1.5">Chèques N°</th>
                        <th className="border-2 border-slate-800 p-1.5">Effets N°</th>
                        <th className="border-2 border-slate-800 p-1.5">Espèces</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-8">
                        <td className="border-2 border-slate-800 p-1">
                          <input
                            type="text"
                            value={modePaiementLabel}
                            onChange={(e) => setModePaiementLabel(e.target.value)}
                            className="w-full bg-transparent text-center font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="border-2 border-slate-800 p-1">
                          <input
                            type="text"
                            value={chequeNum}
                            onChange={(e) => setChequeNum(e.target.value)}
                            className="w-full bg-transparent text-center font-mono focus:outline-none"
                          />
                        </td>
                        <td className="border-2 border-slate-800 p-1">
                          <input
                            type="text"
                            value={effetNum}
                            onChange={(e) => setEffetNum(e.target.value)}
                            className="w-full bg-transparent text-center font-mono focus:outline-none"
                          />
                        </td>
                        <td className="border-2 border-slate-800 p-1">
                          <input
                            type="text"
                            value={especesVal}
                            onChange={(e) => setEspecesVal(e.target.value)}
                            className="w-full bg-transparent text-center font-semibold focus:outline-none"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Column: Totals Table */}
                <div className="sm:col-span-6">
                  <table className="w-full border-collapse border-2 border-slate-800 text-xs">
                    <tbody>
                      <tr>
                        <td className="w-1/2 border-2 border-slate-800 bg-[#DCE6F1] p-2 text-center font-extrabold">
                          Total Hors Taxe
                        </td>
                        <td className="w-1/2 border-2 border-slate-800 p-2 text-center font-mono text-sm font-extrabold">
                          {totalHT.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-slate-800 bg-[#DCE6F1] p-2 text-center font-extrabold">
                          <label className="inline-flex cursor-pointer items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={appliquerTva20}
                              onChange={(e) => setAppliquerTva20(e.target.checked)}
                              className="print:hidden"
                            />
                            <span>TVA à 20%</span>
                          </label>
                        </td>
                        <td className="border-2 border-slate-800 p-2 text-center font-mono text-sm font-extrabold">
                          {montantTVA.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-slate-800 bg-[#DCE6F1] p-2 text-center font-extrabold">
                          Autres
                        </td>
                        <td className="border-2 border-slate-800 p-2 text-center font-mono text-sm font-bold">
                          {autresMontant === 0 ? '-' : autresMontant.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-slate-800 bg-[#DCE6F1] p-2 text-center font-extrabold">
                          Total T.T.C DIRHAMS
                        </td>
                        <td className="border-2 border-slate-800 p-2 text-center font-mono text-base font-black">
                          {totalTTC.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Right Signature & Official Stamp */}
              <div className="mt-10 flex justify-end pr-6">
                <div className="text-center">
                  <div className="inline-block border border-slate-700 px-8 py-2 text-xs font-extrabold text-slate-900">
                    Signataire Gérance.
                  </div>
                  <div className="mt-4 font-sans text-[#1D4ED8]">
                    <p className="text-sm font-black tracking-wide">ABBOUD CAR RENTALS</p>
                    <p className="font-mono text-xs font-extrabold">GSM : 07 01 12 36 37</p>
                    <p className="text-[10px] font-bold">4 ANGLE RUE MOSTAPHA RAFII</p>
                    <p className="text-[10px] font-bold">ET GHARNIT BUREAU N2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* DOCUMENT 2 : MODÈLE OFFICIEL "CONTRAT DE LOCATION" (BILINGUE)     */}
        {/* ================================================================= */}
        {activeDoc === 'contract' && (
          <div className="mx-auto max-w-[860px] border border-slate-400 bg-white p-6 text-[#1E293B] shadow-sm print:border-none print:p-2 print:shadow-none">
            {/* Contract Top Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#1E3A8A] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 180 36" className="h-7 w-auto">
                    <path
                      d="M8,26 C38,16 74,6 116,7 C144,8 164,16 174,24 C152,19 124,15 92,16 C58,17 30,22 8,26 Z"
                      fill="#1E3A8A"
                    />
                  </svg>
                </div>
                <p className="text-lg font-black tracking-wide text-[#1E3A8A]">
                  ABBOUD CAR RENTALS
                </p>
                <p className="text-base font-bold text-[#1E3A8A]">Location de voiture</p>
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
                  <span>Kénitra, le :</span>
                  <input
                    type="text"
                    value={dateContratPaper}
                    onChange={(e) => setDateContratPaper(e.target.value)}
                    className="w-36 border-b border-dotted border-slate-500 bg-transparent font-mono text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-right">
                <h1 className="text-2xl font-black tracking-wider text-[#1E3A8A]">
                  CONTRAT DE LOCATION
                </h1>
                <div className="mt-2 inline-flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#1E3A8A]">N°</span>
                  <input
                    type="text"
                    value={numContratPaper}
                    onChange={(e) => setNumContratPaper(e.target.value)}
                    className="w-32 border-b border-dotted border-red-400 bg-transparent font-mono text-xl font-bold tracking-widest text-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* MAIN TWO-COLUMN GRID MATCHING THE PHYSICAL CONTRACT */}
            <div className="mt-2 grid grid-cols-1 border-2 border-[#1E3A8A] md:grid-cols-2">
              {/* ============================================================= */}
              {/* LEFT COLUMN : LE LOCATAIRE + 2ÈME CONDUCTEUR + DATES + CACHET */}
              {/* ============================================================= */}
              <div className="border-b-2 border-[#1E3A8A] md:border-b-0 md:border-r-2">
                <div className="border-b-2 border-[#1E3A8A] bg-[#F1F5F9] py-1 text-center text-xs font-black tracking-wider text-[#1E3A8A]">
                  LE LOCATAIRE
                </div>

                {/* Bilingual French / Arabic Client Fields */}
                <div className="space-y-1.5 p-3 text-[11px]">
                  {[
                    { labelFr: 'Nom :', val: locNom, set: setLocNom, labelAr: 'الاسم العائلي :' },
                    {
                      labelFr: 'Prénom :',
                      val: locPrenom,
                      set: setLocPrenom,
                      labelAr: 'الاسم الشخصي :',
                    },
                    {
                      labelFr: 'Date de naissance :',
                      val: locNaissance,
                      set: setLocNaissance,
                      labelAr: 'تاريخ الازدياد :',
                    },
                    {
                      labelFr: 'Téléphone :',
                      val: locTel,
                      set: setLocTel,
                      labelAr: 'الهاتف :',
                    },
                    {
                      labelFr: 'Adresse :',
                      val: locAdresse,
                      set: setLocAdresse,
                      labelAr: 'العنوان :',
                    },
                    {
                      labelFr: 'C.I.N. N° :',
                      val: locCin,
                      set: setLocCin,
                      labelAr: 'رقم ب.ت.و :',
                    },
                    {
                      labelFr: "Valable jusqu'au :",
                      val: locCinValable,
                      set: setLocCinValable,
                      labelAr: 'صالحة إلى غاية :',
                    },
                    {
                      labelFr: 'Passeport N° :',
                      val: locPasseport,
                      set: setLocPasseport,
                      labelAr: 'رقم جواز السفر :',
                    },
                    {
                      labelFr: 'Délivré le :',
                      val: locPasseportDelivre,
                      set: setLocPasseportDelivre,
                      labelAr: 'سلمت بتاريخ :',
                    },
                    {
                      labelFr: 'Permis N° :',
                      val: locPermis,
                      set: setLocPermis,
                      labelAr: 'رقم رخصة السياقة :',
                    },
                    {
                      labelFr: 'Délivré le :',
                      val: locPermisDelivre,
                      set: setLocPermisDelivre,
                      labelAr: 'سلمت بتاريخ :',
                    },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">{row.labelFr}</span>
                      <input
                        type="text"
                        value={row.val}
                        onChange={(e) => row.set(e.target.value)}
                        className="min-w-0 flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 text-center font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="shrink-0 font-bold text-[#1E3A8A]" dir="rtl">
                        {row.labelAr}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Le 2éme Conducteur déclaré */}
                <div className="border-y-2 border-[#1E3A8A] bg-[#F1F5F9] py-1 text-center text-xs font-black text-[#1E3A8A]">
                  Le 2éme Conducteur déclaré
                </div>
                <div className="space-y-1 p-3 text-[11px]">
                  {[
                    { label: 'Nom :', val: cond2Nom, set: setCond2Nom },
                    { label: 'Prénom :', val: cond2Prenom, set: setCond2Prenom },
                    { label: 'Date de naissance :', val: cond2Naissance, set: setCond2Naissance },
                    { label: 'Téléphone :', val: cond2Tel, set: setCond2Tel },
                    { label: 'C.I.N. N° :', val: cond2Cin, set: setCond2Cin },
                    { label: 'Permis de conduite N° :', val: cond2Permis, set: setCond2Permis },
                    { label: 'Délivré le :', val: cond2PermisDelivre, set: setCond2PermisDelivre },
                  ].map((r, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">{r.label}</span>
                      <input
                        type="text"
                        value={r.val}
                        onChange={(e) => r.set(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 font-semibold focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Dates Départ / Retour / Prolongation / Rendu */}
                <div className="border-t-2 border-[#1E3A8A] p-3 space-y-1.5 text-[11px]">
                  {[
                    { label: 'Date et heure de départ :', val: ctrDepart, set: setCtrDepart },
                    { label: 'Date et heure de retour :', val: ctrRetour, set: setCtrRetour },
                    {
                      label: 'Date de prolongation :',
                      val: ctrProlongation,
                      set: setCtrProlongation,
                    },
                    { label: 'Véhicule rendu le :', val: ctrRenduLe, set: setCtrRenduLe },
                  ].map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">{d.label}</span>
                      <input
                        type="text"
                        value={d.val}
                        onChange={(e) => d.set(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Signature et Cachet de l'Agence */}
                <div className="border-t-2 border-[#1E3A8A] p-3 text-center">
                  <p className="text-xs font-black text-[#1E3A8A]">
                    SIGNATURE ET CACHET DE L&apos;AGENCE
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Kénitra, le : {dateContratPaper}
                  </p>
                  <div className="mt-2 h-16" />
                </div>
              </div>

              {/* ============================================================= */}
              {/* RIGHT COLUMN : LE VÉHICULE + ÉTAT LIVRAISON + FACTURATION     */}
              {/* ============================================================= */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="border-b-2 border-[#1E3A8A] bg-[#F1F5F9] py-1 text-center text-xs font-black tracking-wider text-[#1E3A8A]">
                    LE VEHICULE EN LOCATION
                  </div>

                  <div className="space-y-1.5 p-3 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">Marque/Modèle :</span>
                      <input
                        type="text"
                        value={vehMarqueModele}
                        onChange={(e) => setVehMarqueModele(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 font-extrabold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">Immatriculation :</span>
                      <input
                        type="text"
                        value={vehImmat}
                        onChange={(e) => setVehImmat(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 font-mono font-extrabold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1 font-bold text-[#1E3A8A]">
                      <span>Carburant</span>
                      <label className="inline-flex cursor-pointer items-center gap-1">
                        <input
                          type="radio"
                          checked={vehCarburantType === 'Sans plomb'}
                          onChange={() => setVehCarburantType('Sans plomb')}
                        />
                        <span>Sans plomb</span>
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-1">
                        <input
                          type="radio"
                          checked={vehCarburantType === 'Gasoil'}
                          onChange={() => setVehCarburantType('Gasoil')}
                        />
                        <span>Gasoil</span>
                      </label>
                    </div>
                  </div>

                  {/* ETAT DU VEHICULE A LA LIVRAISON */}
                  <div className="mx-3 border-2 border-[#1E3A8A] bg-[#F1F5F9] py-1 text-center text-xs font-black text-[#1E3A8A]">
                    ETAT DU VEHICULE A LA LIVRAISON
                  </div>

                  <div className="p-3 text-[11px]">
                    <div className="grid grid-cols-3 items-center gap-2 text-center">
                      {/* Fuel Gauge Arch */}
                      <div>
                        <svg viewBox="0 0 100 55" className="mx-auto h-11 w-20">
                          <path
                            d="M 10 45 A 40 40 0 0 1 90 45"
                            fill="none"
                            stroke="#1E3A8A"
                            strokeWidth="2.5"
                          />
                          <text x="6" y="53" fontSize="8" fill="#1E3A8A" fontWeight="bold">
                            0
                          </text>
                          <text x="43" y="10" fontSize="7" fill="#1E3A8A" fontWeight="bold">
                            1/2
                          </text>
                          <text x="88" y="53" fontSize="8" fill="#1E3A8A" fontWeight="bold">
                            1
                          </text>
                          {/* Needle */}
                          <line
                            x1="50"
                            y1="45"
                            x2={
                              jaugeCarburant === '0'
                                ? 18
                                : jaugeCarburant === '1/4'
                                ? 30
                                : jaugeCarburant === '1/2'
                                ? 50
                                : jaugeCarburant === '3/4'
                                ? 70
                                : 82
                            }
                            y2={jaugeCarburant === '1/2' ? 14 : 25}
                            stroke="#DC2626"
                            strokeWidth="2.5"
                          />
                        </svg>
                        <select
                          value={jaugeCarburant}
                          onChange={(e) =>
                            setJaugeCarburant(e.target.value as typeof jaugeCarburant)
                          }
                          className="mt-0.5 rounded border border-slate-300 bg-transparent px-1 text-[10px] font-bold text-[#1E3A8A]"
                        >
                          <option value="0">CARBURANT : 0</option>
                          <option value="1/4">CARBURANT : 1/4</option>
                          <option value="1/2">CARBURANT : 1/2</option>
                          <option value="3/4">CARBURANT : 3/4</option>
                          <option value="1">CARBURANT : Plein (1)</option>
                        </select>
                      </div>

                      {/* Poste Radio */}
                      <div>
                        <span className="block font-bold text-[#1E3A8A]">Poste Radio</span>
                        <button
                          type="button"
                          onClick={() => setAccPosteRadio(!accPosteRadio)}
                          className="mx-auto mt-1 flex h-6 w-10 items-center justify-center border border-[#1E3A8A]"
                        >
                          {accPosteRadio && <Check className="h-4 w-4 text-[#1E3A8A]" />}
                        </button>
                      </div>

                      {/* Roue de Secours */}
                      <div>
                        <span className="block font-bold text-[#1E3A8A]">Roue de Secours</span>
                        <button
                          type="button"
                          onClick={() => setAccRoueSecours(!accRoueSecours)}
                          className="mx-auto mt-1 flex h-6 w-10 items-center justify-center border border-[#1E3A8A]"
                        >
                          {accRoueSecours && <Check className="h-4 w-4 text-[#1E3A8A]" />}
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Gilet | Top-Down Car Inspection Diagram | Extincteur */}
                    <div className="mt-2 grid grid-cols-12 items-center gap-1 text-center">
                      <div className="col-span-3">
                        <span className="block font-bold text-[#1E3A8A]">Gilet</span>
                        <button
                          type="button"
                          onClick={() => setAccGilet(!accGilet)}
                          className="mx-auto mt-1 flex h-6 w-10 items-center justify-center border border-[#1E3A8A]"
                        >
                          {accGilet && <Check className="h-4 w-4 text-[#1E3A8A]" />}
                        </button>
                      </div>

                      {/* Top-Down Car Inspection SVG */}
                      <div className="col-span-6">
                        <svg viewBox="0 0 200 100" className="mx-auto h-20 w-full">
                          <rect
                            x="20"
                            y="22"
                            width="160"
                            height="56"
                            rx="18"
                            fill="none"
                            stroke="#1E3A8A"
                            strokeWidth="2"
                          />
                          <rect
                            x="55"
                            y="28"
                            width="90"
                            height="44"
                            rx="8"
                            fill="none"
                            stroke="#1E3A8A"
                            strokeWidth="1.5"
                          />
                          <line x1="78" y1="28" x2="78" y2="72" stroke="#1E3A8A" strokeWidth="1.5" />
                          <line
                            x1="128"
                            y1="28"
                            x2="128"
                            y2="72"
                            stroke="#1E3A8A"
                            strokeWidth="1.5"
                          />
                          {/* 4 Wheels */}
                          <rect x="38" y="15" width="26" height="7" rx="2" fill="#1E3A8A" />
                          <rect x="136" y="15" width="26" height="7" rx="2" fill="#1E3A8A" />
                          <rect x="38" y="78" width="26" height="7" rx="2" fill="#1E3A8A" />
                          <rect x="136" y="78" width="26" height="7" rx="2" fill="#1E3A8A" />
                        </svg>
                      </div>

                      <div className="col-span-3">
                        <span className="block font-bold text-[#1E3A8A]">Extincteur</span>
                        <button
                          type="button"
                          onClick={() => setAccExtincteur(!accExtincteur)}
                          className="mx-auto mt-1 flex h-6 w-10 items-center justify-center border border-[#1E3A8A]"
                        >
                          {accExtincteur && <Check className="h-4 w-4 text-[#1E3A8A]" />}
                        </button>
                      </div>
                    </div>

                    {/* Km Départ & Km Retour */}
                    <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <span className="block font-bold text-[#1E3A8A]">Km Départ</span>
                        <input
                          type="text"
                          value={kmDepartPaper}
                          onChange={(e) => setKmDepartPaper(e.target.value)}
                          placeholder="...................."
                          className="mt-0.5 w-full border-b border-dotted border-slate-400 bg-transparent text-center font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="block font-bold text-[#1E3A8A]">Km Retour</span>
                        <input
                          type="text"
                          value={kmRetourPaper}
                          onChange={(e) => setKmRetourPaper(e.target.value)}
                          placeholder="...................."
                          className="mt-0.5 w-full border-b border-dotted border-slate-400 bg-transparent text-center font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CHANGEMENT DE VÉHICULE */}
                  <div className="mx-3 border-2 border-[#1E3A8A] bg-[#F1F5F9] py-1 text-center text-xs font-black text-[#1E3A8A]">
                    CHANGEMENT DE VÉHICULE
                  </div>
                  <div className="space-y-1 p-3 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">Marque/Modèle :</span>
                      <input
                        type="text"
                        value={chgMarqueModele}
                        onChange={(e) => setChgMarqueModele(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">Immatriculation :</span>
                      <input
                        type="text"
                        value={chgImmat}
                        onChange={(e) => setChgImmat(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 font-mono focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 font-bold text-[#1E3A8A]">
                        Date de changement le :
                      </span>
                      <input
                        type="text"
                        value={chgDate}
                        onChange={(e) => setChgDate(e.target.value)}
                        className="flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* FACTURATION SUR CONTRAT */}
                  <div className="mx-3 border-2 border-[#1E3A8A] bg-[#F1F5F9] py-1 text-center text-xs font-black text-[#1E3A8A]">
                    FACTURATION
                  </div>
                  <div className="space-y-1 p-3 text-[11px]">
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span>
                        {dureeJours} Jours ☒ x {prixUnitaireHT} DH
                      </span>
                      <span>= {totalHT.toFixed(2)} DH HT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A]">Total :</span>
                      <span className="font-mono font-extrabold">{totalTTC.toFixed(2)} DH TTC</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A]">Avance :</span>
                      <input
                        type="number"
                        value={factAvance}
                        onChange={(e) => setFactAvance(Number(e.target.value))}
                        className="w-28 border-b border-dotted border-slate-400 bg-transparent text-right font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A]">Reste à payer :</span>
                      <span className="font-mono font-extrabold text-red-600">
                        {resteAPayerContrat.toFixed(2)} DH
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A]">Prolongation :</span>
                      <input
                        type="text"
                        value={factProlongation}
                        onChange={(e) => setFactProlongation(e.target.value)}
                        className="w-36 border-b border-dotted border-slate-400 bg-transparent text-right font-mono focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A]">Mode de payement :</span>
                      <input
                        type="text"
                        value={modePaiementLabel}
                        onChange={(e) => setModePaiementLabel(e.target.value)}
                        className="w-36 border-b border-dotted border-slate-400 bg-transparent text-right font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A]">Franchise Assurance :</span>
                      <input
                        type="text"
                        value={factFranchise}
                        onChange={(e) => setFactFranchise(e.target.value)}
                        className="w-36 border-b border-dotted border-slate-400 bg-transparent text-right font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Signature du Client */}
                <div className="border-t-2 border-[#1E3A8A] p-3 text-center">
                  <p className="text-xs font-black text-[#1E3A8A]">SIGNATURE DU CLIENT</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-600">
                    Je reconnais avoir lu et accepté les conditions générales de location
                  </p>
                  <div className="mt-2 h-16" />
                </div>
              </div>
            </div>

            {/* Official Bottom Footer from Physical Contract */}
            <div className="mt-2 border-t-2 border-[#1E3A8A] pt-2 text-center text-[#1E3A8A]">
              <p className="text-[11px] font-black tracking-wide">
                ATTENTION : CONSERVER CE DOCUMENT QUI DOIT ÊTRE PRÉSENTÉ À TOUT CONTRÔLE DE POLICE
              </p>
              <p className="mt-1 text-[10px] font-extrabold">
                KENZA 9 IMM N°4 ANGLES RUE MOSTAFA ERRAFI ET MOHAMED GHARNIT ENTRE SOL BUREAU N°2,
                KÉNITRA - MAROC
              </p>
              <p className="text-[10px] font-extrabold">
                E-MAIL : ABBOUDCAR59@GMAIL.COM - GSM : (+212) 07 01 12 36 37 / (+212) 07 24 77 44 40
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
