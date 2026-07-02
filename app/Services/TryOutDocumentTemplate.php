<?php

namespace App\Services;

use ZipArchive;

class TryOutDocumentTemplate
{
    public function create(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'try-out-template-');

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $this->contentTypesXml());
        $zip->addFromString('_rels/.rels', $this->relationshipsXml());
        $zip->addFromString('word/document.xml', $this->documentXml());
        $zip->close();

        return $path;
    }

    private function contentTypesXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML;
    }

    private function relationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
XML;
    }

    private function documentXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p>
            <w:pPr><w:pStyle w:val="Title"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>Template Import Try Out Averose</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Petunjuk pengisian</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>- Pertahankan judul BAGIAN 1 dan BAGIAN 2 agar sistem dapat membaca soal dan kunci jawaban.</w:t></w:r></w:p>
        <w:p><w:r><w:t>- Tulis nama subject sebelum kelompok soal, misalnya Matematika Dasar atau Bahasa Indonesia.</w:t></w:r></w:p>
        <w:p><w:r><w:t>- Gunakan nomor soal berformat angka titik, lalu pilihan jawaban berlabel A sampai E.</w:t></w:r></w:p>
        <w:p><w:r><w:t>- Untuk rumus, gunakan fitur Equation bawaan Microsoft Word agar hasil upload lebih rapi.</w:t></w:r></w:p>
        <w:p><w:r><w:t>- Di BAGIAN 2, isi kunci jawaban berurutan sesuai nomor soal. Satu baris cukup berisi nomor dan huruf jawaban.</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>BAGIAN 1: LEMBAR SOAL TKA</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Matematika Dasar</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>1. Hasil dari 2 + 2 adalah ....</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. 1</w:t><w:br/><w:t>B. 2</w:t><w:br/><w:t>C. 3</w:t><w:br/><w:t>D. 4</w:t><w:br/><w:t>E. 5</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. Jika x = 3, maka nilai 2x + 1 adalah ....</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. 5</w:t><w:br/><w:t>B. 6</w:t><w:br/><w:t>C. 7</w:t><w:br/><w:t>D. 8</w:t><w:br/><w:t>E. 9</w:t></w:r></w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Bahasa Indonesia</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>3. Kalimat yang menggunakan ejaan baku adalah ....</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. Saya membeli obat di apotik.</w:t><w:br/><w:t>B. Saya membeli obat di apotek.</w:t><w:br/><w:t>C. Saya membeli obat di apotick.</w:t><w:br/><w:t>D. Saya membeli obat di apoteg.</w:t><w:br/><w:t>E. Saya membeli obat di apotekh.</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>1. D</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. C</w:t></w:r></w:p>
        <w:p><w:r><w:t>3. B</w:t></w:r></w:p>
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
        </w:sectPr>
    </w:body>
</w:document>
XML;
    }
}
