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
            body {
                margin: 0;
                color: #182320;
                font-family: Inter, Arial, sans-serif;
                font-size: 11px;
                line-height: 1.45;
            }

            .page-break {
                page-break-before: always;
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
                margin-bottom: 16px;
                width: 100%;
            }

            .document-title {
                width: 62%;
            }

            .document-meta {
                border-left: 2px solid #16735b;
                padding-left: 10px;
                width: 38%;
            }

            .meta-row {
                margin-bottom: 3px;
            }

            .meta-label {
                color: #66736f;
                display: inline-block;
                width: 20mm;
            }

            .section {
                margin-top: 14px;
            }

            table {
                border-collapse: collapse;
                margin: 6px 0 12px;
                width: 100%;
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
                vertical-align: top;
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
                text-align: right;
            }

            thead th.number {
                text-align: right;
            }

            .rank {
                color: #66736f;
                width: 28px;
            }

            .summary-table tbody td {
                padding-bottom: 8px;
                padding-top: 8px;
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

            .data-panel {
                margin-bottom: 16px;
            }
        </style>
    </head>
    <body>
        <section>
            <table class="document-head">
                <tr>
                    <td class="document-title">
                        <h1>Laporan Dashboard</h1>
                        <p class="muted">Ringkasan data operasional Averose berdasarkan periode terpilih.</p>
                    </td>
                    <td class="document-meta">
                        <div class="meta-row">
                            <span class="meta-label">Periode</span>
                            <span>{{ $period }}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Dibuat</span>
                            <span>{{ $generatedAt->format('d M Y H:i') }}</span>
                        </div>
                    </td>
                </tr>
            </table>

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

        <section class="page-break">
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
        </section>
    </body>
</html>
