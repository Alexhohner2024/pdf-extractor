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
    
    // 1. Номер полиса (ищем после "Поліс №")
    const policyMatch = fullText.match(/Поліс\s*№\s*(\d+)/);
    const policyNumber = policyMatch ? policyMatch[1] : null;

    // 2. ИПН (10 цифр, ищем точнее)
    const ipnMatch = fullText.match(/ЄДРПОУ\s+(\d{10})|(\d{10})/);
    const ipn = ipnMatch ? (ipnMatch[1] || ipnMatch[2]) : null;

    // 3. Цена (ищем в конце документа, число перед последними запятыми)
    const priceMatch = fullText.match(/(\d[\d\s]*),00\s*$/m) || 
                      fullText.match(/премії[^0-9]*(\d[\d\s,]*),00/) ||
                      fullText.match(/(\d{3,4})\s*,\s*00/);
    let price = null;
    if (priceMatch) {
      // Убираем пробелы из цены
      price = priceMatch[1].replace(/\s/g, '');
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