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

    // Ищем нужные данные с помощью регулярных выражений
    
    // 1. Номер полиса (9 цифр после "Поліс №")
    const policyMatch = fullText.match(/Поліс\s*№\s*(\d{9})/);
    const policyNumber = policyMatch ? policyMatch[1] : null;

    // 2. ИПН (10 цифр в разделе 3, обычно после РНОКПП)
    const ipnMatch = fullText.match(/РНОКПП[^0-9]*(\d{10})/);
    const ipn = ipnMatch ? ipnMatch[1] : null;

    // 3. Цена (ищем в разделе 15, числа с пробелами и запятыми)
    const priceMatch = fullText.match(/страхової\s+премії[^0-9]*(\d[\d\s,]+)/);
    let price = null;
    if (priceMatch) {
      // Убираем пробелы и запятые из цены
      price = priceMatch[1].replace(/[\s,]/g, '');
    }

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