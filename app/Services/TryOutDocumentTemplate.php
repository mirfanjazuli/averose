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
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Struktur dokumen. </w:t></w:r>
            <w:r><w:t>Pertahankan judul BAGIAN 1 dan BAGIAN 2. Tulis nama subject sebelum kelompok soal, kemudian gunakan nomor soal dan pilihan A sampai E.</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Rumus dan gambar. </w:t></w:r>
            <w:r><w:t>Gunakan Equation dan fitur Insert Picture bawaan Microsoft Word. Format gambar yang didukung adalah PNG, JPG/JPEG, dan WebP dengan ukuran maksimum 5 MB per gambar.</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Raw Score. </w:t></w:r>
            <w:r><w:t>Jawaban benar memperoleh skor soal, jawaban salah atau kosong memperoleh 0. Skor awal setiap soal adalah 1 dan dapat disesuaikan saat review.</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Negative Marking. </w:t></w:r>
            <w:r><w:t>Nilai correct, wrong, dan no answer diatur saat upload. Multiple answer tetap dapat memperoleh kredit parsial.</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Tipe soal. </w:t></w:r>
            <w:r><w:t>Awali teks soal dengan [SINGLE CHOICE], [MULTIPLE ANSWER], atau [NUMERIC ANSWER]. Tanpa penanda, soal dianggap single choice.</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Kunci jawaban. </w:t></w:r>
            <w:r><w:t>Di BAGIAN 2, tulis satu nomor soal per baris. Gunakan 1. D untuk single choice, 2. A,C untuk multiple answer, dan 3. 12,5 untuk numeric answer. Numeric answer tidak memakai pilihan A sampai E.</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>BAGIAN 1: LEMBAR SOAL TKA</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Matematika Dasar</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>1. [SINGLE CHOICE] Hasil dari 2 + 2 adalah ....</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. 1</w:t><w:br/><w:t>B. 2</w:t><w:br/><w:t>C. 3</w:t><w:br/><w:t>D. 4</w:t><w:br/><w:t>E. 5</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. [MULTIPLE ANSWER] Bilangan ganjil berikut adalah ....</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. 1</w:t><w:br/><w:t>B. 2</w:t><w:br/><w:t>C. 3</w:t><w:br/><w:t>D. 4</w:t><w:br/><w:t>E. 5</w:t></w:r></w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Bahasa Indonesia</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>3. [NUMERIC ANSWER] Jika x + 7 = 19, berapakah nilai x?</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>1. D</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. A,C,E</w:t></w:r></w:p>
        <w:p><w:r><w:t>3. 12</w:t></w:r></w:p>
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
        </w:sectPr>
    </w:body>
</w:document>
XML;
    }
}
