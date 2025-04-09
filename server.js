require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Server is running');
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(),'public','config.html'));
});

// app.listen(3000, '0.0.0.0', () => {
//   console.log(`Server running`);
// });

// Drone Config Server (Google Script)
const droneConfigServerUrl = 'https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec';
// Drone Log Server
const droneLogServerUrl = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records';

// GET /configs/:droneId
app.get('/configs/:droneId', async (req, res) => {
  const droneId = parseInt(req.params.droneId);

  try {
    const response = await axios.get(droneConfigServerUrl);
    const drone = response.data.data.find(d => d.drone_id === droneId);

    if (!drone) return res.status(404).json({ error: 'ไม่พบ Drone ID นี้' });

    const filtered = {
      drone_id: drone.drone_id,
      drone_name: drone.drone_name,
      light: drone.light,
      country: drone.country,
      weight: drone.weight
    };

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching Drone Config:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Drone Config ได้' });
  }
});

// GET /status/:droneId
app.get('/status/:droneId', async (req, res) => {
  const droneId = parseInt(req.params.droneId);

  try {
    const response = await axios.get(droneConfigServerUrl);
    const drone = response.data.data.find(d => d.drone_id === droneId);

    if (!drone) return res.status(404).json({ error: 'ไม่พบ Drone ID นี้' });

    res.json({ condition: drone.condition });
  } catch (error) {
    console.error('Error fetching Drone Status:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Drone Status ได้' });
  }
});

// GET /logs/:droneId
app.get('/logs/:droneId', async (req, res) => {
  const droneId = parseInt(req.params.droneId);

  try {
    const response = await axios.get(`${droneLogServerUrl}?filter=drone_id=${droneId}`);
    const logs = response.data.items || [];

    const filteredLogs = logs
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, 25)
      .map(log => ({
        drone_id: log.drone_id,
        drone_name: log.drone_name,
        created: log.created,
        country: log.country,
        celsius: log.celsius
      }));

    res.json(filteredLogs);
  } catch (error) {
    console.error('Error fetching Drone Logs:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Drone Logs ได้' });
  }
});

// POST /logs
// app.post('/logs', async (req, res) => {
//   const { drone_id, drone_name, country, celsius } = req.body;

//   if (!drone_id || !drone_name || !country || !celsius) {
//     return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
//   }

//   try {
//     const newLog = { drone_id, drone_name, country, celsius };

//     const response = await axios.post(droneLogServerUrl, newLog, {
//       headers: { 'Content-Type': 'application/json' }
//     });

//     res.json(response.data);
//   } catch (error) {
//     console.error('Error creating Drone Log:', error);
//     res.status(500).json({ error: 'ไม่สามารถสร้าง Drone Log ได้' });
//   }
// });

//ทดสอบแปบ

app.post("/logs", async (req, res) => {
  const newLog = req.body;

  console.log('Received log:', newLog);  // ตรวจสอบว่ามีข้อมูลที่รับมา

  // ตรวจสอบข้อมูลก่อนที่จะส่งตอบกลับ
  if (!newLog.drone_id || !newLog.drone_name || !newLog.country || !newLog.celsius) {
    return res.status(400).json({ error: 'Missing required log data' });
  }

  try {
    // เพิ่มการจัดการข้อมูล log หรือบันทึกลงฐานข้อมูลที่ต้องการ
    console.log('Log entry successfully created:', newLog); // Log รายละเอียดที่สร้าง

    // ส่งข้อมูลสำเร็จ
    res.status(200).json({ message: 'Created successfully', log: newLog });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

app.get("/logs", async (req, res) => {
  const droneId = req.query.drone_id;

  if (!droneId) {
    return res.status(400).json({ error: 'Drone ID is required' });
  }

  try {
    const response = await axios.get(`${droneLogServerUrl}?filter=drone_id=${droneId}`); // ดึงข้อมูลจาก API จริง
    const logs = response.data.items || []; // ข้อมูล log จาก API ที่เก็บ

    // คัดกรอง logs ตาม drone_id
    const filteredLogs = logs.filter(log => log.drone_id == droneId);

    // ส่งข้อมูล log ที่ตรงกับ drone_id
    res.status(200).json(filteredLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});



app.get('/logs', async (req, res) => {
  const droneId = req.query.drone_id;
  console.log("Received request for logs with drone_id:", droneId);  // ดูว่าได้รับ drone_id หรือไม่

  try {
    const logs = await getLogsFromDatabase(droneId);  // สมมุติว่าเรียกข้อมูลจากฐานข้อมูล
    res.json(logs.slice(0, 25));  // ส่งข้อมูลจำกัดแค่ 25 รายการ
  } catch (error) {
    console.error('Error fetching logs:', error);  // แสดง error ในเซิร์ฟเวอร์
    res.status(500).json({ message: 'Error fetching logs' });
  }
});


app.post("/logs", async (req, res) => {
  const newLog = req.body;

  console.log('Received log:', newLog);

  res.status(500).json({ message: 'Created successfully', log: newLog });
});


app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});


app.get("/config-data", async (req, res) => {
  const droneId = process.env.DRONE_ID;

  try {
    const response = await axios.get(`${process.env.CONFIG_API}`);
    const data = response.data.data;

    const drone = data.find(d => d.drone_id == droneId);
    if (!drone) return res.status(404).json({ error: "ไม่พบ Drone ID ที่กำหนด" });

    const filtered = {
      drone_id: drone.drone_id,
      drone_name: drone.drone_name,
      light: drone.light,
      country: drone.country
    };

    res.json(filtered);
  } catch (err) {
    console.error("Error loading config:", err.message);
    res.status(500).json({ error: "Error fetching drone config" });
  }
});

async function displayDroneData() {
  try{
    const resultDiv = document.getElementById("droneInfo");
    resultDiv.innerHTML = "";
    data.forEach(dron => {
      const droneInfo =`
      <div class ="drone-card"> 
          <h2>${dron.drone_name} ID: ${dron.drone_id}</h2>
          <p><strong>Light:</strong> ${dron.light}</p>
          <p><strong>Content:</strong> ${dron.country}</p>
      </div>
    `;
      
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById("result").innerHTML = "<p style='color:red;'>Error fetching data</p>";
  }
  
};