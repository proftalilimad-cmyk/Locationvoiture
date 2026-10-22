<?php
/**
 * Contrôleur API PHP 8+ autonome pour Hostinger (Abboud Location - Kénitra, Maroc)
 * Sauvegarde les données de l'agence dans api/abboud/data/abboud-db.json
 * (protégé contre tout accès public direct par le fichier .htaccess).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0750, true);
}
$htaccessPath = $dataDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    @file_put_contents($htaccessPath, "Deny from all\n");
}
$dbFilePath = $dataDir . '/abboud-db.json';

function createInitialNineVehicles(): array {
    $specs = [
        ['ref' => 'P208-01', 'marque' => 'Peugeot', 'modele' => 'Peugeot 208', 'photo' => '/abboud/peugeot-208.png'],
        ['ref' => 'P208-02', 'marque' => 'Peugeot', 'modele' => 'Peugeot 208', 'photo' => '/abboud/peugeot-208.png'],
        ['ref' => 'COR-01',  'marque' => 'Opel',    'modele' => 'Opel Corsa',  'photo' => '/abboud/opel-corsa.png'],
        ['ref' => 'COR-02',  'marque' => 'Opel',    'modele' => 'Opel Corsa',  'photo' => '/abboud/opel-corsa.png'],
        ['ref' => 'TUC-01',  'marque' => 'Hyundai', 'modele' => 'Hyundai Tucson', 'photo' => '/abboud/hyundai-tucson.png'],
        ['ref' => 'CLI-01',  'marque' => 'Renault', 'modele' => 'Renault Clio', 'photo' => '/abboud/renault-clio.png'],
        ['ref' => 'CLI-02',  'marque' => 'Renault', 'modele' => 'Renault Clio', 'photo' => '/abboud/renault-clio.png'],
        ['ref' => 'SAN-01',  'marque' => 'Dacia',   'modele' => 'Dacia Sandero', 'photo' => '/abboud/dacia-sandero.png'],
        ['ref' => 'SAN-02',  'marque' => 'Dacia',   'modele' => 'Dacia Sandero', 'photo' => '/abboud/dacia-sandero.png'],
    ];
    $vehicles = [];
    foreach ($specs as $idx => $item) {
        $n = $idx + 1;
        $vehicles[] = [
            'id' => 'veh-' . $n . '-' . strtolower($item['ref']),
            'referenceInterne' => $item['ref'],
            'marque' => $item['marque'],
            'modele' => $item['modele'],
            'photoUrl' => $item['photo'],
            'photoIllustrative' => true,
            'immatriculation' => '',
            'annee' => null,
            'couleur' => '',
            'carburant' => '',
            'transmission' => '',
            'kilometrage' => null,
            'tarifJournalier' => null,
            'cautionDefaut' => null,
            'assuranceCompagnie' => '',
            'assuranceEcheance' => '',
            'assuranceJustificatif' => '',
            'controleTechniqueEcheance' => '',
            'controleTechniqueJustificatif' => '',
            'prochaineVidangeKm' => null,
            'prochaineVidangeDate' => '',
            'etat' => 'a_renseigner',
            'notes' => '',
        ];
    }
    return $vehicles;
}

function createInitialState(): array {
    return [
        'settings' => [
            'nomAgence' => 'ABBOUD CAR RENTAL',
            'activite' => 'Location de voitures à Kénitra, Maroc',
            'ville' => 'Kénitra, Maroc',
            'slogan' => 'Roulez librement, louez facilement.',
            'telephone1' => '07 24 77 44 40',
            'telephone2' => '07 01 12 36 37',
            'email' => 'abboudcar59@gmail.com',
            'adresse' => '',
            'ice' => '',
            'identifiantFiscal' => '',
            'registreCommerce' => '',
            'patente' => '',
            'cnss' => '',
            'tauxTvaPct' => null,
            'delaiAlerteEcheanceJours' => 30,
            'delaiAlerteVidangeKm' => 1000,
        ],
        'vehicles' => createInitialNineVehicles(),
        'reservationRequests' => [],
        'clients' => [],
        'contracts' => [],
        'invoices' => [],
        'payments' => [],
        'maintenances' => [],
        'credits' => [],
        'expenses' => [],
        '_auth' => [
            'passwordHash' => hash('sha256', 'abboud-salt:abboud2026'),
            'sessions' => [],
        ],
    ];
}

function loadDb(string $path): array {
    if (file_exists($path)) {
        $raw = @file_get_contents($path);
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['vehicles'])) {
                if (!isset($decoded['_auth'])) {
                    $decoded['_auth'] = [
                        'passwordHash' => hash('sha256', 'abboud-salt:abboud2026'),
                        'sessions' => [],
                    ];
                }
                return $decoded;
            }
        }
    }
    $initial = createInitialState();
    saveDb($path, $initial);
    return $initial;
}

function saveDb(string $path, array $db): void {
    @file_put_contents($path, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function sendJson(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function extractToken(array $body): string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $k => $v) {
        if (strtolower((string)$k) === 'authorization' && str_starts_with((string)$v, 'Bearer ')) {
            return trim(substr((string)$v, 7));
        }
    }
    if (!empty($_SERVER['HTTP_AUTHORIZATION']) && str_starts_with($_SERVER['HTTP_AUTHORIZATION'], 'Bearer ')) {
        return trim(substr($_SERVER['HTTP_AUTHORIZATION'], 7));
    }
    return isset($body['token']) ? (string)$body['token'] : '';
}

function assertAdmin(array $db, string $token): void {
    $sessions = $db['_auth']['sessions'] ?? [];
    if (!$token || !in_array($token, $sessions, true)) {
        sendJson(401, ['error' => 'Non autorisé : veuillez vous authentifier à l’administration.']);
    }
}

function computeAlerts(array $db): array {
    $alerts = [];
    $now = time();
    $alertDaysSec = (($db['settings']['delaiAlerteEcheanceJours'] ?? 30) * 86400);
    $alertKmMargin = ($db['settings']['delaiAlerteVidangeKm'] ?? 1000);

    foreach ($db['contracts'] as $c) {
        if (($c['statut'] ?? '') === 'en_cours' && empty($c['retourReel'])) {
            $due = strtotime((string)($c['retourPrevu'] ?? ''));
            if ($due !== false && $due < $now) {
                $alerts[] = [
                    'id' => 'al-ret-' . $c['id'],
                    'categorie' => 'retard_retour',
                    'severite' => 'urgent',
                    'vehicleId' => $c['vehicleId'],
                    'contractId' => $c['id'],
                    'titre' => 'Retard de retour — Contrat ' . ($c['numeroContrat'] ?? ''),
                    'detail' => 'Retour prévu le ' . str_replace('T', ' ', (string)$c['retourPrevu']),
                ];
            }
        }
    }

    foreach ($db['vehicles'] as $v) {
        if ($v['kilometrage'] !== null && $v['prochaineVidangeKm'] !== null) {
            $rem = (int)$v['prochaineVidangeKm'] - (int)$v['kilometrage'];
            if ($rem <= $alertKmMargin) {
                $alerts[] = [
                    'id' => 'al-vid-km-' . $v['id'],
                    'categorie' => 'vidange_km',
                    'severite' => $rem <= 0 ? 'urgent' : 'attention',
                    'vehicleId' => $v['id'],
                    'referenceInterne' => $v['referenceInterne'],
                    'titre' => 'Vidange à prévoir (Kilométrage) — ' . $v['referenceInterne'],
                    'detail' => 'Kilométrage actuel : ' . $v['kilometrage'] . ' km / Seuil : ' . $v['prochaineVidangeKm'] . ' km',
                ];
            }
        }
    }
    return $alerts;
}

function recalculateInvoice(array &$db, string $invoiceId, ?float $overrideTotal = null): array {
    foreach ($db['invoices'] as &$inv) {
        if ($inv['id'] === $invoiceId) {
            if ($overrideTotal !== null) {
                $inv['montantTotalFacture'] = $overrideTotal;
            }
            $totalAvoirs = 0.0;
            foreach (($inv['avoirs'] ?? []) as $av) {
                $totalAvoirs += (float)($av['montant'] ?? 0);
            }
            $inv['montantAvoirs'] = $totalAvoirs;

            $totalPayments = 0.0;
            foreach ($db['payments'] as $p) {
                if (($p['invoiceId'] ?? '') === $invoiceId) {
                    $totalPayments += (float)($p['montant'] ?? 0);
                }
            }
            $inv['montantPayeAffecte'] = $totalPayments;

            $netFacture = max(0.0, (float)$inv['montantTotalFacture'] - $totalAvoirs);
            $inv['resteDu'] = max(0.0, $netFacture - $totalPayments);

            if (($inv['statut'] ?? '') !== 'annulee') {
                if ($netFacture == 0.0 && $totalAvoirs > 0.0) {
                    $inv['statut'] = 'annulee';
                } elseif ($inv['resteDu'] == 0.0 && $totalPayments > 0.0) {
                    $inv['statut'] = 'payee';
                } elseif ($totalPayments > 0.0 && $inv['resteDu'] > 0.0) {
                    $inv['statut'] = 'partiellement_payee';
                } elseif (($inv['statut'] ?? '') !== 'brouillon') {
                    $inv['statut'] = 'emise';
                }
            }
            return $inv;
        }
    }
    sendJson(400, ['error' => 'Facture introuvable.']);
    return [];
}

$route = isset($_GET['route']) ? trim((string)$_GET['route'], '/') : '';
if (!$route && isset($_SERVER['REQUEST_URI'])) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($uriPath && preg_match('#^/api/abboud/(.*)$#', $uriPath, $m)) {
        $route = trim($m[1], '/');
    }
}

$db = loadDb($dbFilePath);
$body = getJsonBody();
$token = extractToken($body);

if ($route === 'public') {
    $order = ['Peugeot 208', 'Opel Corsa', 'Hyundai Tucson', 'Renault Clio', 'Dacia Sandero'];
    $modelGroups = [];
    foreach ($order as $modelName) {
        $matching = array_values(array_filter($db['vehicles'], fn($v) => $v['modele'] === $modelName));
        if (!$matching) continue;
        $first = $matching[0];
        $disp = count(array_filter($matching, fn($v) => $v['etat'] === 'disponible'));
        $aren = count(array_filter($matching, fn($v) => $v['etat'] === 'a_renseigner'));
        $modelGroups[] = [
            'modele' => $modelName,
            'marque' => $first['marque'],
            'quantiteTotale' => count($matching),
            'references' => array_map(fn($v) => $v['referenceInterne'], $matching),
            'photoUrl' => $first['photoUrl'],
            'photoIllustrative' => true,
            'disponiblesConfirmees' => $disp,
            'aRenseignerCount' => $aren,
            'tarifAffiche' => null,
            'carburantAffiche' => '',
            'transmissionAffichee' => '',
        ];
    }
    sendJson(200, [
        'agency' => [
            'nomAgence' => $db['settings']['nomAgence'],
            'activite' => $db['settings']['activite'],
            'ville' => $db['settings']['ville'],
            'slogan' => $db['settings']['slogan'],
            'telephone1' => $db['settings']['telephone1'],
            'telephone2' => $db['settings']['telephone2'],
            'email' => $db['settings']['email'],
            'adresse' => $db['settings']['adresse'],
        ],
        'totalVehiclesCount' => count($db['vehicles']),
        'models' => $modelGroups,
        'vehiclesPublicList' => $db['vehicles'],
    ]);
}

if ($route === 'reservation-request') {
    $modele = trim((string)($body['modeleSouhaite'] ?? ''));
    $nom = trim((string)($body['nomClient'] ?? ''));
    $tel = trim((string)($body['telephone'] ?? ''));
    $dep = (string)($body['departSouhaite'] ?? '');
    $ret = (string)($body['retourSouhaite'] ?? '');
    if (!$modele || !$nom || !$tel || !$dep || !$ret) {
        sendJson(400, ['error' => 'Veuillez renseigner tous les champs obligatoires.']);
    }
    $reqRecord = [
        'id' => 'dem-' . time() . '-' . bin2hex(random_bytes(2)),
        'referenceDemande' => 'DEM-' . date('Y') . '-' . random_int(1000, 9999),
        'modeleSouhaite' => $modele,
        'departSouhaite' => $dep,
        'retourSouhaite' => $ret,
        'lieuPriseEnCharge' => trim((string)($body['lieuPriseEnCharge'] ?? 'Kénitra')),
        'nomClient' => $nom,
        'telephone' => $tel,
        'email' => trim((string)($body['email'] ?? '')),
        'message' => trim((string)($body['message'] ?? '')),
        'statut' => 'en_attente',
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['reservationRequests'], $reqRecord);
    saveDb($dbFilePath, $db);
    sendJson(201, [
        'confirmationMessage' => 'Demande reçue, en attente de confirmation',
        'request' => $reqRecord,
    ]);
}

if ($route === 'auth/login') {
    $pw = (string)($body['password'] ?? '');
    $hash = hash('sha256', 'abboud-salt:' . $pw);
    if ($hash !== ($db['_auth']['passwordHash'] ?? '')) {
        sendJson(401, ['error' => 'Mot de passe administrateur incorrect.']);
    }
    $newToken = 'adm-' . bin2hex(random_bytes(16));
    $db['_auth']['sessions'][] = $newToken;
    saveDb($dbFilePath, $db);
    sendJson(200, ['token' => $newToken]);
}

if ($route === 'admin/state') {
    assertAdmin($db, $token);
    $out = $db;
    unset($out['_auth']);
    $out['alerts'] = computeAlerts($db);
    sendJson(200, $out);
}

if ($route === 'admin/vehicle') {
    assertAdmin($db, $token);
    $upd = $body['vehicle'] ?? [];
    foreach ($db['vehicles'] as &$v) {
        if ($v['id'] === ($upd['id'] ?? '')) {
            $v = array_merge($v, $upd);
            saveDb($dbFilePath, $db);
            sendJson(200, ['vehicle' => $v]);
        }
    }
    sendJson(400, ['error' => 'Véhicule introuvable.']);
}

if ($route === 'admin/client') {
    assertAdmin($db, $token);
    $inp = $body['client'] ?? [];
    if (!empty($inp['id'])) {
        foreach ($db['clients'] as &$c) {
            if ($c['id'] === $inp['id']) {
                $c = array_merge($c, $inp);
                saveDb($dbFilePath, $db);
                sendJson(200, ['client' => $c]);
            }
        }
    }
    $client = [
        'id' => 'cli-' . time() . '-' . bin2hex(random_bytes(2)),
        'nomComplet' => trim((string)($inp['nomComplet'] ?? '')),
        'telephone' => trim((string)($inp['telephone'] ?? '')),
        'email' => trim((string)($inp['email'] ?? '')),
        'cinOuPasseport' => trim((string)($inp['cinOuPasseport'] ?? '')),
        'permisNumero' => trim((string)($inp['permisNumero'] ?? '')),
        'permisDateDelivrance' => (string)($inp['permisDateDelivrance'] ?? ''),
        'adresse' => trim((string)($inp['adresse'] ?? '')),
        'documents' => $inp['documents'] ?? [],
        'notes' => trim((string)($inp['notes'] ?? '')),
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['clients'], $client);
    saveDb($dbFilePath, $db);
    sendJson(200, ['client' => $client]);
}

if ($route === 'admin/request-status') {
    assertAdmin($db, $token);
    $reqId = (string)($body['requestId'] ?? '');
    $statut = (string)($body['statut'] ?? 'en_attente');
    foreach ($db['reservationRequests'] as &$r) {
        if ($r['id'] === $reqId) {
            $r['statut'] = $statut;
            saveDb($dbFilePath, $db);
            sendJson(200, ['request' => $r]);
        }
    }
    sendJson(400, ['error' => 'Demande introuvable.']);
}

if ($route === 'admin/contract') {
    assertAdmin($db, $token);
    $inp = $body['contract'] ?? [];
    $startTs = strtotime((string)($inp['departPrevu'] ?? ''));
    $endTs = strtotime((string)($inp['retourPrevu'] ?? ''));
    if (!$startTs || !$endTs || $endTs <= $startTs) {
        sendJson(400, ['error' => 'Les dates de départ et de retour du contrat sont invalides.']);
    }
    $nbJours = max(1, (int)ceil(($endTs - $startTs) / 86400));
    $tarif = (float)($inp['tarifJournalierConvenu'] ?? 0);
    $frais = (float)($inp['fraisSupplementaires'] ?? 0);
    $remise = (float)($inp['remise'] ?? 0);
    $totalLoc = max(0.0, $nbJours * $tarif + $frais - $remise);
    $nowIso = gmdate('c');

    // Vérification anti-chevauchement sur le même véhicule
    if (in_array(($inp['statut'] ?? ''), ['confirme', 'en_cours'], true)) {
        foreach ($db['contracts'] as $existingCtr) {
            if (!empty($inp['id']) && $existingCtr['id'] === $inp['id']) continue;
            if ($existingCtr['vehicleId'] !== ($inp['vehicleId'] ?? '')) continue;
            if (!in_array($existingCtr['statut'], ['confirme', 'en_cours'], true)) continue;
            $exStart = strtotime((string)$existingCtr['departPrevu']);
            $exEnd = strtotime((string)(!empty($existingCtr['retourReel']) ? $existingCtr['retourReel'] : $existingCtr['retourPrevu']));
            if ($startTs < $exEnd && $exStart < $endTs) {
                sendJson(409, ['error' => 'Chevauchement interdit : ce véhicule fait déjà l’objet du contrat ' . $existingCtr['numeroContrat'] . ' sur cette période.']);
            }
        }
    }

    $contract = null;
    if (!empty($inp['id'])) {
        foreach ($db['contracts'] as &$c) {
            if ($c['id'] === $inp['id']) {
                $c = array_merge($c, $inp, [
                    'nbJours' => $nbJours,
                    'tarifJournalierConvenu' => $tarif,
                    'fraisSupplementaires' => $frais,
                    'remise' => $remise,
                    'montantTotalLocation' => $totalLoc + (float)($c['fraisRetourValides'] ?? 0),
                    'updatedAt' => $nowIso,
                ]);
                $contract = $c;
                break;
            }
        }
    } else {
        $seq = str_pad((string)(count($db['contracts']) + 1), 4, '0', STR_PAD_LEFT);
        $contract = [
            'id' => 'ctr-' . time() . '-' . bin2hex(random_bytes(2)),
            'numeroContrat' => 'CTR-' . date('Y') . '-' . $seq,
            'clientId' => (string)($inp['clientId'] ?? ''),
            'vehicleId' => (string)($inp['vehicleId'] ?? ''),
            'departPrevu' => (string)$inp['departPrevu'],
            'retourPrevu' => (string)$inp['retourPrevu'],
            'retourReel' => '',
            'lieuDepart' => (string)($inp['lieuDepart'] ?? 'Kénitra'),
            'lieuRetour' => (string)($inp['lieuRetour'] ?? 'Kénitra'),
            'nbJours' => $nbJours,
            'tarifJournalierConvenu' => $tarif,
            'fraisSupplementaires' => $frais,
            'remise' => $remise,
            'montantTotalLocation' => $totalLoc,
            'cautionMontant' => (float)($inp['cautionMontant'] ?? 0),
            'cautionStatut' => (string)($inp['cautionStatut'] ?? 'non_recue'),
            'cautionMode' => (string)($inp['cautionMode'] ?? 'Espèces / Chèque de garantie'),
            'kmDepart' => $inp['kmDepart'] ?? null,
            'carburantDepart' => (string)($inp['carburantDepart'] ?? ''),
            'etatDepartNotes' => (string)($inp['etatDepartNotes'] ?? ''),
            'kmRetour' => null,
            'carburantRetour' => '',
            'observationsRetour' => '',
            'fraisRetourValides' => 0,
            'statut' => (string)($inp['statut'] ?? 'confirme'),
            'createdAt' => $nowIso,
            'updatedAt' => $nowIso,
        ];
        array_unshift($db['contracts'], $contract);
    }

    foreach ($db['vehicles'] as &$v) {
        if ($v['id'] === $contract['vehicleId']) {
            if ($contract['statut'] === 'en_cours') {
                $v['etat'] = 'louee';
            } elseif ($contract['statut'] === 'confirme' && $v['etat'] !== 'louee') {
                $v['etat'] = 'reservee';
            }
        }
    }

    $invoice = null;
    foreach ($db['invoices'] as $inv) {
        if ($inv['contractId'] === $contract['id']) {
            $invoice = recalculateInvoice($db, $inv['id'], (float)$contract['montantTotalLocation']);
            break;
        }
    }
    if (!empty($inp['autoCreateInvoice']) && !$invoice) {
        $invSeq = str_pad((string)(count($db['invoices']) + 1), 4, '0', STR_PAD_LEFT);
        $invoice = [
            'id' => 'fac-' . time() . '-' . bin2hex(random_bytes(2)),
            'numeroFacture' => 'FAC-' . date('Y') . '-' . $invSeq,
            'contractId' => $contract['id'],
            'clientId' => $contract['clientId'],
            'dateEmission' => substr($nowIso, 0, 10),
            'dateEcheance' => substr((string)$contract['retourPrevu'], 0, 10),
            'montantTotalFacture' => (float)$contract['montantTotalLocation'],
            'montantAvoirs' => 0,
            'montantPayeAffecte' => 0,
            'resteDu' => (float)$contract['montantTotalLocation'],
            'statut' => $contract['statut'] === 'brouillon' ? 'brouillon' : 'emise',
            'notes' => '',
            'avoirs' => [],
            'createdAt' => $nowIso,
        ];
        array_unshift($db['invoices'], $invoice);
    }

    saveDb($dbFilePath, $db);
    sendJson(200, ['contract' => $contract, 'invoice' => $invoice]);
}

if ($route === 'admin/contract-extend') {
    assertAdmin($db, $token);
    $cid = (string)($body['contractId'] ?? '');
    $newRet = (string)($body['nouveauRetourPrevu'] ?? '');
    $addFrais = (float)($body['fraisSupplementairesAjoutes'] ?? 0);
    foreach ($db['contracts'] as &$c) {
        if ($c['id'] === $cid) {
            $c['retourPrevu'] = $newRet;
            $startTs = strtotime((string)$c['departPrevu']);
            $endTs = strtotime($newRet);
            $c['nbJours'] = max(1, (int)ceil(($endTs - $startTs) / 86400));
            $c['fraisSupplementaires'] = (float)$c['fraisSupplementaires'] + $addFrais;
            $c['montantTotalLocation'] = max(
                0.0,
                $c['nbJours'] * (float)$c['tarifJournalierConvenu'] + (float)$c['fraisSupplementaires'] + (float)$c['fraisRetourValides'] - (float)$c['remise']
            );
            $c['updatedAt'] = gmdate('c');
            foreach ($db['invoices'] as $inv) {
                if ($inv['contractId'] === $cid) {
                    recalculateInvoice($db, $inv['id'], (float)$c['montantTotalLocation']);
                }
            }
            saveDb($dbFilePath, $db);
            sendJson(200, ['contract' => $c]);
        }
    }
    sendJson(400, ['error' => 'Contrat introuvable.']);
}

if ($route === 'admin/contract-return') {
    assertAdmin($db, $token);
    $cid = (string)($body['contractId'] ?? '');
    foreach ($db['contracts'] as &$c) {
        if ($c['id'] === $cid) {
            $c['retourReel'] = (string)($body['retourReel'] ?? date('Y-m-d\TH:i'));
            $c['kmRetour'] = $body['kmRetour'] ?? null;
            $c['carburantRetour'] = (string)($body['carburantRetour'] ?? '');
            $c['observationsRetour'] = (string)($body['observationsRetour'] ?? '');
            $c['fraisRetourValides'] = (float)($body['fraisRetourValides'] ?? 0);
            if (!empty($body['cautionStatut'])) {
                $c['cautionStatut'] = (string)$body['cautionStatut'];
            }
            $c['montantTotalLocation'] = max(
                0.0,
                (int)$c['nbJours'] * (float)$c['tarifJournalierConvenu'] + (float)$c['fraisSupplementaires'] + (float)$c['fraisRetourValides'] - (float)$c['remise']
            );
            $c['statut'] = 'cloture';
            $c['updatedAt'] = gmdate('c');

            $vehOut = null;
            foreach ($db['vehicles'] as &$v) {
                if ($v['id'] === $c['vehicleId']) {
                    if ($c['kmRetour'] !== null && is_numeric($c['kmRetour'])) {
                        $v['kilometrage'] = (int)$c['kmRetour'];
                    }
                    if (!empty($body['declarerEnEntretien']) || $v['etat'] === 'en_entretien') {
                        $v['etat'] = 'en_entretien';
                    } elseif ($v['etat'] !== 'indisponible') {
                        $v['etat'] = 'disponible';
                    }
                    $vehOut = $v;
                    break;
                }
            }

            foreach ($db['invoices'] as $inv) {
                if ($inv['contractId'] === $cid) {
                    recalculateInvoice($db, $inv['id'], (float)$c['montantTotalLocation']);
                }
            }

            saveDb($dbFilePath, $db);
            sendJson(200, ['contract' => $c, 'vehicle' => $vehOut]);
        }
    }
    sendJson(400, ['error' => 'Contrat introuvable.']);
}

if ($route === 'admin/invoice') {
    assertAdmin($db, $token);
    $inp = $body['invoice'] ?? [];
    if (!empty($inp['id'])) {
        foreach ($db['invoices'] as &$inv) {
            if ($inv['id'] === $inp['id']) {
                $inv['dateEmission'] = (string)($inp['dateEmission'] ?? $inv['dateEmission']);
                $inv['dateEcheance'] = (string)($inp['dateEcheance'] ?? $inv['dateEcheance']);
                if (!empty($inp['statut'])) $inv['statut'] = (string)$inp['statut'];
                if (isset($inp['notes'])) $inv['notes'] = (string)$inp['notes'];
                $updated = recalculateInvoice($db, $inv['id'], (float)($inp['montantTotalFacture'] ?? $inv['montantTotalFacture']));
                saveDb($dbFilePath, $db);
                sendJson(200, ['invoice' => $updated]);
            }
        }
    }
    $contractId = (string)($inp['contractId'] ?? '');
    $clientId = '';
    foreach ($db['contracts'] as $c) {
        if ($c['id'] === $contractId) {
            $clientId = $c['clientId'];
            break;
        }
    }
    $seq = str_pad((string)(count($db['invoices']) + 1), 4, '0', STR_PAD_LEFT);
    $tot = (float)($inp['montantTotalFacture'] ?? 0);
    $newInv = [
        'id' => 'fac-' . time() . '-' . bin2hex(random_bytes(2)),
        'numeroFacture' => 'FAC-' . date('Y') . '-' . $seq,
        'contractId' => $contractId,
        'clientId' => $clientId,
        'dateEmission' => (string)($inp['dateEmission'] ?? date('Y-m-d')),
        'dateEcheance' => (string)($inp['dateEcheance'] ?? date('Y-m-d')),
        'montantTotalFacture' => $tot,
        'montantAvoirs' => 0,
        'montantPayeAffecte' => 0,
        'resteDu' => $tot,
        'statut' => (string)($inp['statut'] ?? 'emise'),
        'notes' => (string)($inp['notes'] ?? ''),
        'avoirs' => [],
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['invoices'], $newInv);
    saveDb($dbFilePath, $db);
    sendJson(200, ['invoice' => $newInv]);
}

if ($route === 'admin/payment') {
    assertAdmin($db, $token);
    $inp = $body['payment'] ?? [];
    $invId = (string)($inp['invoiceId'] ?? '');
    $montant = (float)($inp['montant'] ?? 0);
    if ($montant <= 0) {
        sendJson(400, ['error' => 'Le montant du paiement doit être supérieur à zéro.']);
    }
    $payment = [
        'id' => 'pay-' . time() . '-' . bin2hex(random_bytes(2)),
        'invoiceId' => $invId,
        'datePaiement' => (string)($inp['datePaiement'] ?? date('Y-m-d')),
        'montant' => $montant,
        'modePaiement' => (string)($inp['modePaiement'] ?? 'especes'),
        'referenceOperation' => (string)($inp['referenceOperation'] ?? ''),
        'notes' => (string)($inp['notes'] ?? ''),
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['payments'], $payment);
    $inv = recalculateInvoice($db, $invId);
    saveDb($dbFilePath, $db);
    sendJson(200, ['payment' => $payment, 'invoice' => $inv]);
}

if ($route === 'admin/credit-note') {
    assertAdmin($db, $token);
    $invId = (string)($body['invoiceId'] ?? '');
    $montant = (float)($body['montant'] ?? 0);
    $motif = trim((string)($body['motif'] ?? 'Avoir'));
    foreach ($db['invoices'] as &$inv) {
        if ($inv['id'] === $invId) {
            $inv['avoirs'][] = [
                'id' => 'avr-' . time() . '-' . bin2hex(random_bytes(2)),
                'numeroAvoir' => 'AVR-' . date('Y') . '-' . random_int(100, 999),
                'dateAvoir' => date('Y-m-d'),
                'montant' => $montant,
                'motif' => $motif,
            ];
            if (!empty($body['annulerFacture'])) {
                $inv['statut'] = 'annulee';
            }
            $updated = recalculateInvoice($db, $invId);
            saveDb($dbFilePath, $db);
            sendJson(200, ['invoice' => $updated]);
        }
    }
    sendJson(400, ['error' => 'Facture introuvable.']);
}

if ($route === 'admin/maintenance') {
    assertAdmin($db, $token);
    $inp = $body['maintenance'] ?? [];
    $maint = [
        'id' => 'mnt-' . time() . '-' . bin2hex(random_bytes(2)),
        'vehicleId' => (string)($inp['vehicleId'] ?? ''),
        'typeIntervention' => (string)($inp['typeIntervention'] ?? 'entretien'),
        'dateIntervention' => (string)($inp['dateIntervention'] ?? date('Y-m-d')),
        'kilometrageIntervention' => $inp['kilometrageIntervention'] ?? null,
        'cout' => (float)($inp['cout'] ?? 0),
        'prestataire' => (string)($inp['prestataire'] ?? ''),
        'prochaineEcheanceKm' => $inp['prochaineEcheanceKm'] ?? null,
        'prochaineEcheanceDate' => (string)($inp['prochaineEcheanceDate'] ?? ''),
        'notes' => (string)($inp['notes'] ?? ''),
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['maintenances'], $maint);
    foreach ($db['vehicles'] as &$v) {
        if ($v['id'] === $maint['vehicleId']) {
            if (!empty($inp['mettreVehiculeEnEntretien'])) {
                $v['etat'] = 'en_entretien';
            }
            if ($maint['prochaineEcheanceKm'] !== null) {
                $v['prochaineVidangeKm'] = (int)$maint['prochaineEcheanceKm'];
            }
            if (!empty($maint['prochaineEcheanceDate'])) {
                $v['prochaineVidangeDate'] = $maint['prochaineEcheanceDate'];
            }
        }
    }
    saveDb($dbFilePath, $db);
    sendJson(200, ['maintenance' => $maint]);
}

if ($route === 'admin/vehicle-credit') {
    assertAdmin($db, $token);
    $inp = $body['credit'] ?? [];
    $credit = [
        'id' => 'crd-' . time() . '-' . bin2hex(random_bytes(2)),
        'vehicleId' => (string)($inp['vehicleId'] ?? ''),
        'organismeFinancement' => (string)($inp['organismeFinancement'] ?? ''),
        'numeroDossier' => (string)($inp['numeroDossier'] ?? ''),
        'montantInitialFinancement' => (float)($inp['montantInitialFinancement'] ?? 0),
        'mensualiteContractuelle' => (float)($inp['mensualiteContractuelle'] ?? 0),
        'dureeTotaleMois' => (int)($inp['dureeTotaleMois'] ?? 12),
        'dateDebut' => (string)($inp['dateDebut'] ?? date('Y-m-d')),
        'dateFin' => (string)($inp['dateFin'] ?? ''),
        'capitalRestantDuDocumente' => $inp['capitalRestantDuDocumente'] ?? null,
        'totalMensualitesVersees' => 0,
        'nombreEcheancesPayees' => 0,
        'paiements' => [],
        'notes' => (string)($inp['notes'] ?? ''),
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['credits'], $credit);
    saveDb($dbFilePath, $db);
    sendJson(200, ['credit' => $credit]);
}

if ($route === 'admin/credit-installment') {
    assertAdmin($db, $token);
    $cid = (string)($body['creditId'] ?? '');
    foreach ($db['credits'] as &$cr) {
        if ($cr['id'] === $cid) {
            $verse = (float)($body['montantMensualiteVersee'] ?? 0);
            $cr['paiements'][] = [
                'id' => 'ech-' . time() . '-' . bin2hex(random_bytes(2)),
                'datePaiement' => (string)($body['datePaiement'] ?? date('Y-m-d')),
                'montantMensualiteVersee' => $verse,
                'partCapitalDocumentee' => $body['partCapitalDocumentee'] ?? null,
                'partInteretsEtFrais' => $body['partInteretsEtFrais'] ?? null,
                'nouveauSoldeCapitalCommunique' => $body['nouveauSoldeCapitalCommunique'] ?? null,
                'reference' => (string)($body['reference'] ?? ''),
            ];
            $cr['totalMensualitesVersees'] = (float)$cr['totalMensualitesVersees'] + $verse;
            $cr['nombreEcheancesPayees'] = count($cr['paiements']);
            if (isset($body['nouveauSoldeCapitalCommunique']) && $body['nouveauSoldeCapitalCommunique'] !== null) {
                $cr['capitalRestantDuDocumente'] = (float)$body['nouveauSoldeCapitalCommunique'];
            }
            saveDb($dbFilePath, $db);
            sendJson(200, ['credit' => $cr]);
        }
    }
    sendJson(400, ['error' => 'Dossier de crédit introuvable.']);
}

if ($route === 'admin/expense') {
    assertAdmin($db, $token);
    $inp = $body['expense'] ?? [];
    $exp = [
        'id' => 'dep-' . time() . '-' . bin2hex(random_bytes(2)),
        'dateDepense' => (string)($inp['dateDepense'] ?? date('Y-m-d')),
        'categorie' => (string)($inp['categorie'] ?? 'autre'),
        'libelle' => (string)($inp['libelle'] ?? ''),
        'montant' => (float)($inp['montant'] ?? 0),
        'vehicleId' => $inp['vehicleId'] ?? null,
        'modePaiement' => (string)($inp['modePaiement'] ?? 'especes'),
        'justificatif' => (string)($inp['justificatif'] ?? ''),
        'notes' => (string)($inp['notes'] ?? ''),
        'createdAt' => gmdate('c'),
    ];
    array_unshift($db['expenses'], $exp);
    saveDb($dbFilePath, $db);
    sendJson(200, ['expense' => $exp]);
}

if ($route === 'admin/settings') {
    assertAdmin($db, $token);
    $updates = $body['updates'] ?? [];
    $db['settings'] = array_merge($db['settings'], $updates);
    saveDb($dbFilePath, $db);
    sendJson(200, ['settings' => $db['settings']]);
}

if ($route === 'admin/password') {
    assertAdmin($db, $token);
    $newPw = (string)($body['newPassword'] ?? '');
    if (strlen($newPw) < 6) {
        sendJson(400, ['error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères.']);
    }
    $db['_auth']['passwordHash'] = hash('sha256', 'abboud-salt:' . $newPw);
    saveDb($dbFilePath, $db);
    sendJson(200, ['ok' => true]);
}

if ($route === 'admin/reset') {
    assertAdmin($db, $token);
    $auth = $db['_auth'];
    $db = createInitialState();
    $db['_auth'] = $auth;
    saveDb($dbFilePath, $db);
    $out = $db;
    unset($out['_auth']);
    $out['alerts'] = [];
    sendJson(200, $out);
}

if ($route === 'admin/import') {
    assertAdmin($db, $token);
    $state = $body['state'] ?? null;
    if (!is_array($state) || !isset($state['vehicles'])) {
        sendJson(400, ['error' => 'Sauvegarde JSON invalide.']);
    }
    $auth = $db['_auth'];
    $db = $state;
    $db['_auth'] = $auth;
    saveDb($dbFilePath, $db);
    $out = $db;
    unset($out['_auth']);
    $out['alerts'] = computeAlerts($db);
    sendJson(200, $out);
}

sendJson(404, ['error' => 'Route API introuvable: ' . $route]);
