@php
    $dailyRows = collect($charts['sessionTotals']['items'])
        ->map(function (array $item, int $index) use ($charts): array {
            return [
                'label' => $item['label'],
                'registrants' => $charts['programRegistrants']['items'][$index]['value'] ?? 0,
                'sessions' => $item['value'],
            ];
        });
@endphp
<!doctype html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <title>Averose Admin Dashboard</title>
        <style>
            @page {
                size: A4;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                color: #182320;
                font-family: Inter, Arial, sans-serif;
                font-size: 11px;
                line-height: 1.45;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .watermark {
                left: 50%;
                opacity: 0.88;
                position: fixed;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 112mm;
                z-index: -1;
            }

            .watermark img {
                display: block;
                width: 100%;
            }

            .report-page {
                break-after: page;
            }

            .report-page:last-child {
                break-after: auto;
            }

            h1,
            h2,
            h3,
            p {
                margin: 0;
            }

            h1 {
                font-size: 20px;
                letter-spacing: 0;
                line-height: 1.2;
            }

            h2 {
                border-bottom: 1px solid #a7b8b2;
                color: #0f5e4a;
                font-size: 12px;
                letter-spacing: 0;
                margin-bottom: 8px;
                padding-bottom: 5px;
                text-transform: uppercase;
            }

            .muted {
                color: #66736f;
            }

            .document-head {
                align-items: flex-start;
                display: flex;
                gap: 18px;
                justify-content: space-between;
                margin-bottom: 16px;
            }

            .document-title {
                max-width: 105mm;
            }

            .document-meta {
                border-left: 2px solid #16735b;
                min-width: 56mm;
                padding-left: 10px;
            }

            .meta-row {
                display: grid;
                gap: 8px;
                grid-template-columns: 20mm minmax(0, 1fr);
                margin-bottom: 3px;
            }

            .meta-label {
                color: #66736f;
            }

            .section {
                margin-top: 14px;
            }

            table {
                border-collapse: separate;
                border-spacing: 0;
                margin: 6px 0 12px;
                table-layout: fixed;
                width: 100%;
            }

            thead {
                display: table-header-group;
            }

            thead th {
                background: #16735b;
                color: #ffffff;
                font-size: 9px;
                letter-spacing: 0;
                padding: 10px 9px;
                text-align: left;
                text-transform: uppercase;
            }

            th,
            td {
                overflow-wrap: anywhere;
                word-break: normal;
            }

            tbody td {
                background: transparent;
                border-bottom: 1px solid #dbe6e2;
                padding: 9px;
            }

            tbody tr:nth-child(even) td {
                background: transparent;
            }

            .number {
                font-variant-numeric: tabular-nums;
                text-align: right;
            }

            .rank {
                color: #66736f;
                width: 28px;
            }

            .summary-table tbody td {
                padding-block: 8px;
            }

            .summary-value {
                color: #0f5e4a;
                font-size: 14px;
                font-weight: 800;
            }

            .daily-table th:first-child,
            .daily-table td:first-child {
                width: 56%;
            }

            .daily-table th:nth-child(2),
            .daily-table td:nth-child(2),
            .daily-table th:nth-child(3),
            .daily-table td:nth-child(3) {
                width: 22%;
            }

            .two-column {
                display: grid;
                gap: 12px;
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .data-panel {
                break-inside: avoid;
            }

            tr {
                break-inside: avoid;
            }
        </style>
    </head>
    <body>
        @if ($watermarkImage)
            <div class="watermark">
                <img src="{{ $watermarkImage }}" alt="">
            </div>
        @endif

        <section class="report-page">
            <header class="document-head">
                <div class="document-title">
                    <h1>Laporan Dashboard</h1>
                    <p class="muted">Ringkasan data operasional Averose berdasarkan periode terpilih.</p>
                </div>
                <div class="document-meta">
                    <div class="meta-row">
                        <span class="meta-label">Periode</span>
                        <span>{{ $period }}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Dibuat</span>
                        <span>{{ $generatedAt->format('d M Y H:i') }}</span>
                    </div>
                </div>
            </header>

            <section class="section">
                <h2>Ringkasan</h2>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Indikator</th>
                            <th class="number">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($stats as $stat)
                            <tr>
                                <td>
                                    {{ match ($stat['label']) {
                                        'Total Program' => 'Program',
                                        'Total Sesi' => 'Sesi',
                                        default => $stat['label'],
                                    } }}
                                </td>
                                <td class="number summary-value">{{ $stat['value'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </section>

            <section class="section">
                <h2>{{ $activityTableTitle }}</h2>
                <table class="daily-table">
                    <thead>
                        <tr>
                            <th>{{ $activityPeriodLabel }}</th>
                            <th class="number">Total Sesi</th>
                            <th class="number">Total Pendaftar</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($dailyRows as $row)
                            <tr>
                                <td>{{ $row['label'] }}</td>
                                <td class="number">{{ $row['sessions'] }}</td>
                                <td class="number">{{ $row['registrants'] }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3">Belum ada data pada periode ini.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </section>
        </section>

        <section class="report-page">
            <div class="two-column">
                <section class="data-panel">
                    <h2>{{ $charts['popularPrograms']['title'] }}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th class="rank">#</th>
                                <th>Program</th>
                                <th class="number">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($charts['popularPrograms']['items'] as $item)
                                <tr>
                                    <td class="rank">{{ $loop->iteration }}</td>
                                    <td>{{ $item['label'] }}</td>
                                    <td class="number">{{ $item['value'] }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="3">Belum ada data pada periode ini.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </section>

                <section class="data-panel">
                    <h2>{{ $charts['popularSubjects']['title'] }}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th class="rank">#</th>
                                <th>Mata Pelajaran</th>
                                <th class="number">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($charts['popularSubjects']['items'] as $item)
                                <tr>
                                    <td class="rank">{{ $loop->iteration }}</td>
                                    <td>{{ $item['label'] }}</td>
                                    <td class="number">{{ $item['value'] }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="3">Belum ada data pada periode ini.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </section>
            </div>
        </section>
    </body>
</html>
