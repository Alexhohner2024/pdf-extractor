const pdf = require('pdf-parse');

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем PDF данные из запроса
    const { pdfData } = req.body;
    
    if (!pdfData) {
      return res.status(400).json({ error: 'PDF data required' });
    }

    // Конвертируем base64 в buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    // Извлекаем текст из PDF
    const data = await pdf(pdfBuffer);
    const fullText = data.text;

    // 1. Номер полиса - ищем везде, где есть 9 цифр
    const policyMatch = fullText.match(/Поліс\s*№\s*(\d{9})/) || 
                       fullText.match(/№(\d{9})/) ||
                       fullText.match(/(\d{9})/);
    const policyNumber = policyMatch ? policyMatch[1] : null;

    // 2. ИПН - 10 цифр после РНОКПП или ЄДРПОУ
    const ipnMatch = fullText.match(/РНОКПП[^\d]*(\d{10})/) ||
                    fullText.match(/ЄДРПОУ[^\d]*(\d{10})/);
    const ipn = ipnMatch ? ipnMatch[1] : null;

    // 3. Цена - ищем в разделе 15 или после слова премії
    const priceMatch = fullText.match(/15\.\s*Розмір\s+страхової\s+премії[^0-9]*(\d{3,4})/) ||
                      fullText.match(/премії.*?(\d{3,4})\s*,\s*00/) ||
                      fullText.match(/сплачується.*?(\d{3,4})\s*,\s*00/) ||
                      fullText.match(/(\d{3,4})\s*,\s*00/);
    const price = priceMatch ? priceMatch[1] : null;

    // Debug - логируем что нашли
    console.log('Found price patterns:', fullText.match(/\d{3,4}\s*,\s*00/g));
    console.log('Section 15 found:', fullText.includes('15. Розмір страхової премії'));

    // Возвращаем результат в формате price|ipn|policy_number
    const result = `${price || ''}|${ipn || ''}|${policyNumber || ''}`;

    return res.status(200).json({
      success: true,
      result: result,
      details: {
        price: price,
        ipn: ipn,
        policy_number: policyNumber
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return res.status(500).json({ 
      error: 'Failed to process PDF',
      message: error.message 
    });
  }
}