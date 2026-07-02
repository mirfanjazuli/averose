<?php

namespace App\Services;

use App\Models\Subject;
use App\Models\TryOut;
use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class TryOutDocumentImporter
{
    /**
     * @param  array{title?: string|null, duration_minutes?: int|null, status?: string|null}  $attributes
     */
    public function import(UploadedFile $document, array $attributes = []): TryOut
    {
        $parsedQuestions = $this->parse($document->getRealPath());

        return $this->importParsed(
            $parsedQuestions,
            $document->getClientOriginalName(),
            $attributes
        );
    }

    /**
     * @param  array<int, array{answer: string|null, number: int, options: array<string, string>, options_html: array<string, string>, question_html: string, question_text: string, subject_name: string|null}>  $parsedQuestions
     * @param  array{title?: string|null, duration_minutes?: int|null, status?: string|null}  $attributes
     */
    public function importParsed(array $parsedQuestions, string $sourceFileName, array $attributes = []): TryOut
    {
        if ($parsedQuestions === []) {
            throw ValidationException::withMessages([
                'document' => 'No questions were found in this document.',
            ]);
        }

        return DB::transaction(function () use ($attributes, $sourceFileName, $parsedQuestions): TryOut {
            $tryOut = TryOut::query()->create([
                'duration_minutes' => $attributes['duration_minutes'] ?? null,
                'source_file_name' => null,
                'status' => $attributes['status'] ?? 'draft',
                'title' => filled($attributes['title'] ?? null)
                    ? $attributes['title']
                    : pathinfo($sourceFileName, PATHINFO_FILENAME),
            ]);

            foreach ($parsedQuestions as $question) {
                $tryOut->questions()->create([
                    'answer' => $question['answer'],
                    'number' => $question['number'],
                    'options' => $question['options'],
                    'options_html' => $question['options_html'],
                    'question_html' => $question['question_html'],
                    'question_text' => $question['question_text'],
                    'subject_id' => $this->matchingSubjectId($question['subject_name']),
                    'subject_name' => $question['subject_name'],
                ]);
            }

            return $tryOut->load('questions');
        });
    }

    /**
     * @param  array<int, array{answer: string|null, number: int, options: array<string, string>, options_html: array<string, string>, question_html: string, question_text: string, subject_name: string|null}>  $parsedQuestions
     */
    public function replaceQuestions(TryOut $tryOut, array $parsedQuestions): TryOut
    {
        if ($parsedQuestions === []) {
            throw ValidationException::withMessages([
                'document' => 'No questions were found in this document.',
            ]);
        }

        return DB::transaction(function () use ($parsedQuestions, $tryOut): TryOut {
            $tryOut->questions()->delete();

            foreach ($parsedQuestions as $question) {
                $tryOut->questions()->create([
                    'answer' => $question['answer'],
                    'number' => $question['number'],
                    'options' => $question['options'],
                    'options_html' => $question['options_html'],
                    'question_html' => $question['question_html'],
                    'question_text' => $question['question_text'],
                    'subject_id' => $this->matchingSubjectId($question['subject_name']),
                    'subject_name' => $question['subject_name'],
                ]);
            }

            return $tryOut->refresh()->load('questions');
        });
    }

    /**
     * @return array<int, array{answer: string|null, number: int, options: array<string, string>, options_html: array<string, string>, question_html: string, question_text: string, subject_name: string|null}>
     */
    public function parse(string $path): array
    {
        $lines = $this->paragraphLines($path);
        $questions = [];
        $answers = [];
        $currentQuestion = null;
        $currentSubject = null;
        $isAnswerSection = false;

        foreach ($lines as $line) {
            if (preg_match('/^BAGIAN\s*2\b/i', $line['text']) === 1) {
                if ($currentQuestion !== null) {
                    $questions[] = $currentQuestion;
                    $currentQuestion = null;
                }

                $isAnswerSection = true;

                continue;
            }

            if ($isAnswerSection) {
                preg_match_all('/\b[A-E]\b/iu', $line['text'], $matches);
                array_push($answers, ...array_map('strtoupper', $matches[0]));

                continue;
            }

            if (preg_match('/^BAGIAN\s*1\b/i', $line['text']) === 1) {
                continue;
            }

            if (
                $currentQuestion !== null
                && $this->hasOptions($currentQuestion['raw_text'])
                && $this->looksLikeSubjectHeading($line['text'])
            ) {
                $questions[] = $currentQuestion;
                $currentQuestion = null;
                $currentSubject = $this->normalizeLine($line['text']);

                continue;
            }

            if (preg_match('/^(\d+)\.\s*(.+)$/u', $line['text'], $matches) === 1) {
                if ($currentQuestion !== null) {
                    $questions[] = $currentQuestion;
                }

                $currentQuestion = [
                    'number' => (int) $matches[1],
                    'raw_html' => $this->stripLeadingQuestionNumberHtml($line['html'], (int) $matches[1]),
                    'raw_text' => $matches[2],
                    'subject_name' => $currentSubject,
                ];

                continue;
            }

            if ($currentQuestion === null) {
                $currentSubject = $this->normalizeLine($line['text']);

                continue;
            }

            $currentQuestion['raw_html'] .= ' '.$line['html'];
            $currentQuestion['raw_text'] .= ' '.$line['text'];
        }

        if ($currentQuestion !== null) {
            $questions[] = $currentQuestion;
        }

        return collect($questions)
            ->map(function (array $question, int $index) use ($answers): array {
                $splitQuestion = $this->splitQuestionOptions($question['raw_text'], $question['raw_html'] ?? null);

                return [
                    'answer' => $answers[$index] ?? null,
                    'number' => $question['number'],
                    'options' => $splitQuestion['options'],
                    'options_html' => $splitQuestion['options_html'],
                    'question_html' => $splitQuestion['question_html'],
                    'question_text' => $splitQuestion['question_text'],
                    'subject_name' => $question['subject_name'],
                ];
            })
            ->filter(fn (array $question): bool => filled($question['question_text']) && $question['options'] !== [])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{html: string, text: string}>
     */
    private function paragraphLines(string $path): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages([
                'document' => 'The uploaded document could not be opened.',
            ]);
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if ($xml === false) {
            throw ValidationException::withMessages([
                'document' => 'The uploaded document is not a valid Word document.',
            ]);
        }

        $document = new DOMDocument;
        $document->loadXML($xml);

        $xpath = new DOMXPath($document);
        $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');

        $lines = [];

        foreach ($xpath->query('//w:p') as $paragraph) {
            if (! $paragraph instanceof DOMElement) {
                continue;
            }

            $line = $this->normalizeLine($this->nodeText($paragraph));

            if ($line !== '') {
                $lines[] = [
                    'html' => $this->normalizeRichHtml($this->nodeHtml($paragraph)),
                    'text' => $line,
                ];
            }
        }

        return $lines;
    }

    private function nodeText(DOMNode $node): string
    {
        if ($this->isMathNode($node)) {
            return $this->mathText($node);
        }

        $text = '';

        foreach ($node->childNodes as $child) {
            if ($child->localName === 't') {
                $text .= $child->textContent;

                continue;
            }

            if ($child->localName === 'tab') {
                $text .= ' ';

                continue;
            }

            if ($child->localName === 'br') {
                $text .= ' ';

                continue;
            }

            $text .= $this->nodeText($child);
        }

        return $text;
    }

    private function isMathNode(DOMNode $node): bool
    {
        return $node->namespaceURI === 'http://schemas.openxmlformats.org/officeDocument/2006/math';
    }

    private function nodeHtml(DOMNode $node): string
    {
        if ($this->isMathNode($node)) {
            return $this->mathHtml($node);
        }

        $html = '';

        foreach ($node->childNodes as $child) {
            if ($child->localName === 't') {
                $html .= e($child->textContent);

                continue;
            }

            if ($child->localName === 'tab') {
                $html .= ' ';

                continue;
            }

            if ($child->localName === 'br') {
                $html .= '<br>';

                continue;
            }

            $html .= $this->nodeHtml($child);
        }

        return $html;
    }

    private function mathHtml(DOMNode $node): string
    {
        return match ($node->localName) {
            'acc' => $this->mathAccentHtml($node),
            'bar' => $this->mathBarHtml($node),
            'd' => $this->mathDelimiterHtml($node),
            'den' => $this->mathChildrenHtml($node),
            'e' => $this->mathChildrenHtml($node),
            'f' => $this->mathFractionHtml($node),
            'func' => $this->mathChildrenHtml($node),
            'lim' => $this->mathChildrenHtml($node),
            'limLow' => $this->mathLimitHtml($node, 'munder'),
            'limUpp' => $this->mathLimitHtml($node, 'mover'),
            'nary' => $this->mathNaryHtml($node),
            'num' => $this->mathChildrenHtml($node),
            'oMath' => $this->isInsideMathParagraph($node)
                ? $this->mathChildrenHtml($node)
                : '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow>'.$this->mathChildrenHtml($node).'</mrow></math>',
            'oMathPara' => '<math class="math-equation" display="block" xmlns="http://www.w3.org/1998/Math/MathML"><mrow>'.$this->mathChildrenHtml($node).'</mrow></math>',
            'rad' => $this->mathRadicalHtml($node),
            'r' => $this->mathRunHtml($node),
            'sSub' => $this->mathSubscriptHtml($node),
            'sSubSup' => $this->mathSubscriptSuperscriptHtml($node),
            'sSup' => $this->mathSuperscriptHtml($node),
            'sub' => $this->mathChildrenHtml($node),
            'sup' => $this->mathChildrenHtml($node),
            't' => $this->mathTokenHtml($node->textContent),
            default => $this->mathChildrenHtml($node),
        };
    }

    private function mathText(DOMNode $node): string
    {
        return match ($node->localName) {
            'acc' => $this->mathChildText($node, 'e'),
            'bar' => $this->mathChildText($node, 'e'),
            'd' => $this->mathChildText($node, 'e'),
            'den' => $this->mathChildrenText($node),
            'e' => $this->mathChildrenText($node),
            'f' => $this->fractionText($node),
            'lim' => $this->mathChildrenText($node),
            'nary' => $this->naryText($node),
            'num' => $this->mathChildrenText($node),
            'oMath' => $this->mathChildrenText($node),
            'oMathPara' => $this->mathChildrenText($node),
            'rad' => $this->radicalText($node),
            'r' => $this->mathChildrenText($node),
            'sSub' => $this->subscriptText($node),
            'sSubSup' => $this->subscriptSuperscriptText($node),
            'sSup' => $this->superscriptText($node),
            'sub' => $this->mathChildrenText($node),
            'sup' => $this->mathChildrenText($node),
            't' => $node->textContent,
            default => $this->mathChildrenText($node),
        };
    }

    private function fractionText(DOMNode $node): string
    {
        $numerator = $this->mathChildText($node, 'num');
        $denominator = $this->mathChildText($node, 'den');

        return "({$numerator})/({$denominator})";
    }

    private function superscriptText(DOMNode $node): string
    {
        $base = $this->mathChildText($node, 'e');
        $superscript = $this->mathChildText($node, 'sup');

        return "{$base}^{$superscript}";
    }

    private function subscriptText(DOMNode $node): string
    {
        $base = $this->mathChildText($node, 'e');
        $subscript = $this->mathChildText($node, 'sub');

        return "{$base}_{$subscript}";
    }

    private function subscriptSuperscriptText(DOMNode $node): string
    {
        $base = $this->mathChildText($node, 'e');
        $subscript = $this->mathChildText($node, 'sub');
        $superscript = $this->mathChildText($node, 'sup');

        return "{$base}_{$subscript}^{$superscript}";
    }

    private function radicalText(DOMNode $node): string
    {
        $degree = $this->mathChildText($node, 'deg');
        $base = $this->mathChildText($node, 'e');

        if ($degree !== '') {
            return "root[{$degree}]({$base})";
        }

        return "sqrt({$base})";
    }

    private function naryText(DOMNode $node): string
    {
        $operator = $this->mathNaryOperator($node);
        $subscript = $this->mathChildText($node, 'sub');
        $superscript = $this->mathChildText($node, 'sup');
        $body = $this->mathChildText($node, 'e');

        $limitText = '';

        if ($subscript !== '') {
            $limitText .= "_{$subscript}";
        }

        if ($superscript !== '') {
            $limitText .= "^{$superscript}";
        }

        return "{$operator}{$limitText} {$body}";
    }

    private function mathFractionHtml(DOMNode $node): string
    {
        return '<mfrac>'
            .$this->wrapMathRow($this->mathChildHtml($node, 'num'))
            .$this->wrapMathRow($this->mathChildHtml($node, 'den'))
            .'</mfrac>';
    }

    private function mathSuperscriptHtml(DOMNode $node): string
    {
        return '<msup>'
            .$this->wrapMathRow($this->mathChildHtml($node, 'e'))
            .$this->wrapMathRow($this->mathChildHtml($node, 'sup'))
            .'</msup>';
    }

    private function mathSubscriptHtml(DOMNode $node): string
    {
        return '<msub>'
            .$this->wrapMathRow($this->mathChildHtml($node, 'e'))
            .$this->wrapMathRow($this->mathChildHtml($node, 'sub'))
            .'</msub>';
    }

    private function mathSubscriptSuperscriptHtml(DOMNode $node): string
    {
        return '<msubsup>'
            .$this->wrapMathRow($this->mathChildHtml($node, 'e'))
            .$this->wrapMathRow($this->mathChildHtml($node, 'sub'))
            .$this->wrapMathRow($this->mathChildHtml($node, 'sup'))
            .'</msubsup>';
    }

    private function mathRadicalHtml(DOMNode $node): string
    {
        $degree = $this->mathChildHtml($node, 'deg');
        $base = $this->mathChildHtml($node, 'e');

        if ($degree !== '') {
            return '<mroot>'.$this->wrapMathRow($base).$this->wrapMathRow($degree).'</mroot>';
        }

        return '<msqrt>'.$this->wrapMathRow($base).'</msqrt>';
    }

    private function mathNaryHtml(DOMNode $node): string
    {
        $operator = '<mo>'.$this->escapeMathText($this->mathNaryOperator($node)).'</mo>';
        $subscript = $this->mathChildHtml($node, 'sub');
        $superscript = $this->mathChildHtml($node, 'sup');
        $body = $this->mathChildHtml($node, 'e');

        if ($subscript !== '' && $superscript !== '') {
            $operator = '<munderover>'.$operator.$this->wrapMathRow($subscript).$this->wrapMathRow($superscript).'</munderover>';
        } elseif ($subscript !== '') {
            $operator = '<munder>'.$operator.$this->wrapMathRow($subscript).'</munder>';
        } elseif ($superscript !== '') {
            $operator = '<mover>'.$operator.$this->wrapMathRow($superscript).'</mover>';
        }

        return '<mrow>'.$operator.$body.'</mrow>';
    }

    private function mathLimitHtml(DOMNode $node, string $tag): string
    {
        return '<'.$tag.'>'
            .$this->wrapMathRow($this->mathChildHtml($node, 'e'))
            .$this->wrapMathRow($this->mathChildHtml($node, 'lim'))
            .'</'.$tag.'>';
    }

    private function mathDelimiterHtml(DOMNode $node): string
    {
        $body = $this->mathChildHtml($node, 'e');
        $begin = $this->mathDelimiterCharacter($node, 'begChr', '(');
        $end = $this->mathDelimiterCharacter($node, 'endChr', ')');

        return '<mrow><mo>'.$this->escapeMathText($begin).'</mo>'.$body.'<mo>'.$this->escapeMathText($end).'</mo></mrow>';
    }

    private function mathAccentHtml(DOMNode $node): string
    {
        $accent = $this->mathAccentCharacter($node);

        return '<mover accent="true">'
            .$this->wrapMathRow($this->mathChildHtml($node, 'e'))
            .'<mo>'.$this->escapeMathText($accent).'</mo>'
            .'</mover>';
    }

    private function mathBarHtml(DOMNode $node): string
    {
        return '<mover accent="true">'
            .$this->wrapMathRow($this->mathChildHtml($node, 'e'))
            .'<mo>¯</mo>'
            .'</mover>';
    }

    private function mathNaryOperator(DOMNode $node): string
    {
        foreach ($node->childNodes as $child) {
            if ($child->localName !== 'naryPr') {
                continue;
            }

            foreach ($child->childNodes as $property) {
                if ($property->localName !== 'chr' || ! $property instanceof DOMElement) {
                    continue;
                }

                return $property->getAttributeNS(
                    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                    'val'
                ) ?: '∫';
            }
        }

        return '∫';
    }

    private function mathDelimiterCharacter(DOMNode $node, string $propertyName, string $fallback): string
    {
        foreach ($node->childNodes as $child) {
            if ($child->localName !== 'dPr') {
                continue;
            }

            foreach ($child->childNodes as $property) {
                if ($property->localName !== $propertyName || ! $property instanceof DOMElement) {
                    continue;
                }

                return $property->getAttributeNS(
                    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                    'val'
                ) ?: $fallback;
            }
        }

        return $fallback;
    }

    private function mathAccentCharacter(DOMNode $node): string
    {
        foreach ($node->childNodes as $child) {
            if ($child->localName !== 'accPr') {
                continue;
            }

            foreach ($child->childNodes as $property) {
                if ($property->localName !== 'chr' || ! $property instanceof DOMElement) {
                    continue;
                }

                return $property->getAttributeNS(
                    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                    'val'
                ) ?: 'ˆ';
            }
        }

        return 'ˆ';
    }

    private function mathChildText(DOMNode $node, string $localName): string
    {
        foreach ($node->childNodes as $child) {
            if ($child->localName === $localName) {
                return $this->mathText($child);
            }
        }

        return '';
    }

    private function mathChildHtml(DOMNode $node, string $localName): string
    {
        foreach ($node->childNodes as $child) {
            if ($child->localName === $localName) {
                return $this->mathHtml($child);
            }
        }

        return '';
    }

    private function mathChildrenText(DOMNode $node): string
    {
        $text = '';

        foreach ($node->childNodes as $child) {
            $text .= $this->isMathNode($child) ? $this->mathText($child) : $this->nodeText($child);
        }

        return $text;
    }

    private function mathChildrenHtml(DOMNode $node): string
    {
        $html = '';

        foreach ($node->childNodes as $child) {
            $html .= $this->isMathNode($child) ? $this->mathHtml($child) : $this->nodeHtml($child);
        }

        return $html;
    }

    private function mathRunHtml(DOMNode $node): string
    {
        $html = '';

        foreach ($node->childNodes as $child) {
            if ($child->localName === 't') {
                $html .= $this->mathTokenHtml($child->textContent);

                continue;
            }

            $html .= $this->isMathNode($child) ? $this->mathHtml($child) : $this->nodeHtml($child);
        }

        return $html;
    }

    private function mathTokenHtml(string $text): string
    {
        preg_match_all('/\s+|[0-9]+(?:[,.][0-9]+)?|[A-Za-z]+|[+\-*\/=<>≤≥±∞∫∑√→←↔πθɑαβγδλμσ]+|./u', $text, $matches);

        return collect($matches[0])
            ->map(function (string $token): string {
                if (preg_match('/^\s+$/u', $token) === 1) {
                    return '<mspace width="0.25em"></mspace>';
                }

                if (preg_match('/^[0-9]+(?:[,.][0-9]+)?$/u', $token) === 1) {
                    return '<mn>'.$this->escapeMathText($token).'</mn>';
                }

                if (preg_match('/^[+\-*\/=<>≤≥±∞∫∑√→←↔]+$/u', $token) === 1 || in_array($token, ['.', ',', ';', ':', '(', ')', '[', ']', '{', '}'], true)) {
                    return '<mo>'.$this->escapeMathText($token).'</mo>';
                }

                if (preg_match('/^[A-Za-zπθɑαβγδλμσ]+$/u', $token) === 1) {
                    return '<mi>'.$this->escapeMathText($token).'</mi>';
                }

                return '<mtext>'.$this->escapeMathText($token).'</mtext>';
            })
            ->implode('');
    }

    private function wrapMathRow(string $html): string
    {
        return '<mrow>'.$html.'</mrow>';
    }

    private function isInsideMathParagraph(DOMNode $node): bool
    {
        return $node->parentNode instanceof DOMNode && $node->parentNode->localName === 'oMathPara';
    }

    private function escapeMathText(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function normalizeLine(string $line): string
    {
        return Str::of($line)
            ->replace(["\u{00a0}", "\u{2009}", "\u{202f}"], ' ')
            ->replaceMatches('/\s+/u', ' ')
            ->trim()
            ->toString();
    }

    private function normalizeRichHtml(string $html): string
    {
        return Str::of($html)
            ->replace(["\u{00a0}", "\u{2009}", "\u{202f}"], ' ')
            ->trim()
            ->toString();
    }

    private function stripLeadingQuestionNumberHtml(string $html, int $number): string
    {
        return preg_replace('/^\s*'.preg_quote((string) $number, '/').'\.\s*/u', '', $html, 1) ?? $html;
    }

    private function hasOptions(string $line): bool
    {
        return preg_match('/A\.\s*.+B\.\s*.+/iu', $line) === 1;
    }

    private function looksLikeSubjectHeading(string $line): bool
    {
        return preg_match('/^\d+\./u', $line) !== 1
            && preg_match('/[A-E]\./iu', $line) !== 1
            && mb_strlen($line) <= 60;
    }

    /**
     * @return array{options: array<string, string>, options_html: array<string, string>, question_html: string, question_text: string}
     */
    private function splitQuestionOptions(string $rawText, ?string $rawHtml = null): array
    {
        $normalizedText = $this->normalizeLine($rawText);
        $normalizedHtml = $this->normalizeRichHtml($rawHtml ?? e($normalizedText));
        $options = [];
        $optionsHtml = [];

        preg_match_all('/(?:(?<![A-Za-z])|(?=[A-E]\.\s))([A-E])\.\s*/iu', $normalizedText, $matches, PREG_OFFSET_CAPTURE);
        $textStartIndex = $this->firstAnswerOptionMarkerIndex($matches[1]);

        if ($textStartIndex > 0) {
            $matches[0] = array_values(array_slice($matches[0], $textStartIndex));
            $matches[1] = array_values(array_slice($matches[1], $textStartIndex));
        }

        if ($matches[0] === []) {
            return [
                'options' => [],
                'options_html' => [],
                'question_html' => $normalizedHtml,
                'question_text' => $normalizedText,
            ];
        }

        $questionText = $this->normalizeLine(substr($normalizedText, 0, $matches[0][0][1]));
        $questionHtml = e($questionText);

        preg_match_all('/(?:(?<![A-Za-z])|(?=[A-E]\.\s))([A-E])\.\s*/iu', $normalizedHtml, $htmlMatches, PREG_OFFSET_CAPTURE);
        $htmlStartIndex = $this->firstAnswerOptionMarkerIndex($htmlMatches[1]);

        if ($htmlStartIndex > 0) {
            $htmlMatches[0] = array_values(array_slice($htmlMatches[0], $htmlStartIndex));
            $htmlMatches[1] = array_values(array_slice($htmlMatches[1], $htmlStartIndex));
        }

        $canSplitHtml = count($htmlMatches[0]) === count($matches[0]);

        if ($canSplitHtml) {
            $questionHtml = $this->normalizeRichHtml(substr($normalizedHtml, 0, $htmlMatches[0][0][1]));
        }

        foreach ($matches[0] as $index => $marker) {
            $optionKey = strtoupper($matches[1][$index][0]);
            $optionStart = $marker[1] + strlen($marker[0]);
            $optionEnd = $matches[0][$index + 1][1] ?? strlen($normalizedText);

            $options[$optionKey] = $this->normalizeLine(substr($normalizedText, $optionStart, $optionEnd - $optionStart));

            if ($canSplitHtml) {
                $htmlOptionStart = $htmlMatches[0][$index][1] + strlen($htmlMatches[0][$index][0]);
                $htmlOptionEnd = $htmlMatches[0][$index + 1][1] ?? strlen($normalizedHtml);
                $optionsHtml[$optionKey] = $this->normalizeRichHtml(substr($normalizedHtml, $htmlOptionStart, $htmlOptionEnd - $htmlOptionStart));
            } else {
                $optionsHtml[$optionKey] = e($options[$optionKey]);
            }
        }

        return [
            'options' => $options,
            'options_html' => $optionsHtml,
            'question_html' => $questionHtml,
            'question_text' => $questionText,
        ];
    }

    /**
     * @param  array<int, array{0: string, 1: int}>  $markers
     */
    private function firstAnswerOptionMarkerIndex(array $markers): int
    {
        foreach ($markers as $index => $marker) {
            if (strtoupper($marker[0]) === 'A') {
                return $index;
            }
        }

        return 0;
    }

    private function matchingSubjectId(?string $subjectName): ?int
    {
        if (blank($subjectName)) {
            return null;
        }

        return Subject::query()
            ->whereRaw('lower(name) = ?', [Str::lower($subjectName)])
            ->value('id');
    }
}
