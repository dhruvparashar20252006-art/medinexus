
import { useEffect, useState } from 'react'
import './App.css'

const initialMedicines = [
  {
    id: 1,
    name: 'Paracetamol',
    category: 'Pain relief',
    stock: 120,
    minimum: 30,
    expiry: '2027-06-30',
  },
  {
    id: 2,
    name: 'Amoxicillin',
    category: 'Antibiotic',
    stock: 18,
    minimum: 25,
    expiry: '2027-03-15',
  },
  {
    id: 3,
    name: 'ORS Sachets',
    category: 'Hydration',
    stock: 12,
    minimum: 20,
    expiry: '2027-01-20',
  },
  {
    id: 4,
    name: 'Cetirizine',
    category: 'Allergy relief',
    stock: 75,
    minimum: 20,
    expiry: '2027-08-10',
  },
]

const emptyMedicine = {
  name: '',
  category: '',
  stock: '',
  minimum: '',
  expiry: '',
}

function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [medicines, setMedicines] = useState(() => {
    try {
      const saved = localStorage.getItem('medinexus_medicines')
      return saved ? JSON.parse(saved) : initialMedicines
    } catch {
      return initialMedicines
    }
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [newMedicine, setNewMedicine] = useState(emptyMedicine)

  // Save medicine data whenever the list changes.
  useEffect(() => {
    try {
      localStorage.setItem(
        'medinexus_medicines',
        JSON.stringify(medicines),
      )
    } catch (error) {
      console.error('Could not save medicines:', error)
    }
  }, [medicines])

  const lowStock = medicines.filter(
    (medicine) => medicine.stock <= medicine.minimum,
  )

  const expiringSoon = medicines.filter((medicine) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiryDate = new Date(`${medicine.expiry}T00:00:00`)
    const daysLeft =
      (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)

    return daysLeft >= 0 && daysLeft <= 30
  })

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  )

  function updateField(field, value) {
    setNewMedicine((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function handleAddMedicine(event) {
    event.preventDefault()

    if (
      !newMedicine.name.trim() ||
      !newMedicine.category.trim() ||
      newMedicine.stock === '' ||
      newMedicine.minimum === '' ||
      !newMedicine.expiry
    ) {
      return
    }

    const stock = Number(newMedicine.stock)
    const minimum = Number(newMedicine.minimum)

    if (
      !Number.isInteger(stock) ||
      !Number.isInteger(minimum) ||
      stock < 0 ||
      minimum < 0
    ) {
      return
    }

    setMedicines((previous) => [
      ...previous,
      {
        id: Date.now(),
        name: newMedicine.name.trim(),
        category: newMedicine.category.trim(),
        stock,
        minimum,
        expiry: newMedicine.expiry,
      },
    ])

    setNewMedicine({ ...emptyMedicine })
  }

  function renderMedicineStatus(medicine) {
    const isLow = medicine.stock <= medicine.minimum

    return (
      <span className={`status ${isLow ? 'low' : 'good'}`}>
        {isLow ? 'Low stock' : 'In stock'}
      </span>
    )
  }

  function renderInventoryTable() {
    return (
      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Stock</th>
              <th>Minimum</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredMedicines.map((medicine) => (
              <tr key={medicine.id}>
                <td>
                  <strong>{medicine.name}</strong>
                  <small>{medicine.category}</small>
                </td>
                <td>{medicine.stock}</td>
                <td>{medicine.minimum}</td>
                <td>{medicine.expiry}</td>
                <td>{renderMedicineStatus(medicine)}</td>
              </tr>
            ))}

            {filteredMedicines.length === 0 && (
              <tr>
                <td colSpan="5">No medicines match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  function renderMedicineForm() {
    return (
      <>
        <input
          className="medicine-search"
          type="text"
          placeholder="Search medicines by name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <form className="medicine-form" onSubmit={handleAddMedicine}>
          <input
            type="text"
            placeholder="Medicine name"
            value={newMedicine.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Category"
            value={newMedicine.category}
            onChange={(event) => updateField('category', event.target.value)}
            required
          />

          <input
            type="number"
            min="0"
            step="1"
            placeholder="Current stock"
            value={newMedicine.stock}
            onChange={(event) => updateField('stock', event.target.value)}
            required
          />

          <input
            type="number"
            min="0"
            step="1"
            placeholder="Minimum stock"
            value={newMedicine.minimum}
            onChange={(event) => updateField('minimum', event.target.value)}
            required
          />

          <input
            type="date"
            aria-label="Expiry date"
            value={newMedicine.expiry}
            onChange={(event) => updateField('expiry', event.target.value)}
            required
          />

          <button className="primary-button" type="submit">
            + Add Medicine
          </button>
        </form>

        {renderInventoryTable()}
      </>
    )
  }

  function renderAlerts() {
    return (
      <>
        {lowStock.length === 0 && expiringSoon.length === 0 && (
          <p>No current inventory alerts.</p>
        )}

        {lowStock.map((medicine) => (
          <div className="alert-item" key={`low-${medicine.id}`}>
            <span className="alert-symbol orange">!</span>
            <div>
              <strong>{medicine.name} running low</strong>
              <p>
                {medicine.stock} units remaining; minimum is{' '}
                {medicine.minimum}.
              </p>
            </div>
          </div>
        ))}

        {expiringSoon.map((medicine) => (
          <div className="alert-item" key={`expiry-${medicine.id}`}>
            <span className="alert-symbol purple">⌛</span>
            <div>
              <strong>{medicine.name} expiry review</strong>
              <p>Expiry date: {medicine.expiry}</p>
            </div>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">✚ MediNexus</h2>
        <p className="sidebar-label">MAIN MENU</p>

        {['Overview', 'Patients', 'Medicines', 'Alerts', 'Reports'].map(
          (item) => (
            <button
              key={item}
              className={`nav-item ${activeTab === item ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              <span>
                {{
                  Overview: '▦',
                  Patients: '♙',
                  Medicines: '✚',
                  Alerts: '⚑',
                  Reports: '▤',
                }[item]}
              </span>

              <span>{item}</span>

              {item === 'Alerts' && (
                <span className="alert-count">{lowStock.length}</span>
              )}
            </button>
          ),
        )}

        <div className="sidebar-bottom">
          <div className="user-avatar">AD</div>
          <div>
            <strong>Admin Demo</strong>
            <small>Administrator</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">HOSPITAL MANAGEMENT</p>
            <h1>{activeTab}</h1>
          </div>

          <div className="topbar-right">
            <span className="secure-label">🔒 Demo environment</span>
            <div className="user-avatar">AD</div>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow light">MEDINEXUS DASHBOARD</p>
                <h2>Welcome, Admin 👋</h2>
                <p>
                  Monitor hospital records, medicine stock, and important
                  alerts.
                </p>
              </div>
              <div className="welcome-icon">✚</div>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-icon blue">♙</div>
                <p>Total Patients</p>
                <h2>248</h2>
                <small>Fictional demo records</small>
              </article>

              <article className="stat-card">
                <div className="stat-icon green">✚</div>
                <p>Medicines Tracked</p>
                <h2>{medicines.length}</h2>
                <small>Inventory items</small>
              </article>

              <article className="stat-card">
                <div className="stat-icon orange">⚑</div>
                <p>Low Stock Alerts</p>
                <h2>{lowStock.length}</h2>
                <small className="warning-text">Needs attention</small>
              </article>

              <article className="stat-card">
                <div className="stat-icon purple">▤</div>
                <p>Expiring Soon</p>
                <h2>{expiringSoon.length}</h2>
                <small>Within 30 days</small>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel inventory-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Medicine Inventory</h3>
                    <p>Current sample stock levels</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActiveTab('Medicines')}
                  >
                    View all →
                  </button>
                </div>

                {medicines.slice(0, 4).map((medicine) => (
                  <div className="medicine-row" key={medicine.id}>
                    <div className="medicine-icon">✚</div>
                    <div className="medicine-info">
                      <strong>{medicine.name}</strong>
                      <small>{medicine.category}</small>
                    </div>
                    <div className="stock-info">
                      <strong>{medicine.stock} units</strong>
                      {renderMedicineStatus(medicine)}
                    </div>
                  </div>
                ))}
              </article>

              <article className="panel alerts-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Attention Required</h3>
                    <p>Inventory notifications</p>
                  </div>
                  <span className="alert-badge">
                    {lowStock.length + expiringSoon.length} alerts
                  </span>
                </div>

                {renderAlerts()}

                <button
                  className="primary-button"
                  onClick={() => setActiveTab('Alerts')}
                >
                  Review all alerts
                </button>
              </article>
            </section>

            <p className="footer-note">
              MediNexus · Student project prototype · All displayed data is
              fictional
            </p>
          </>
        )}

        {activeTab === 'Medicines' && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Medicine Inventory</h3>
                <p>Search, add, and review medicine stock</p>
              </div>
            </div>
            {renderMedicineForm()}
          </section>
        )}

        {activeTab === 'Patients' && (
          <section className="panel placeholder-panel">
            <div className="placeholder-icon">♙</div>
            <h2>Patient Records</h2>
            <p>
              This module is a placeholder for fictional patient records and
              role-based access controls. No real patient data is used.
            </p>
            <button
              className="primary-button"
              onClick={() => setActiveTab('Overview')}
            >
              Back to Overview
            </button>
          </section>
        )}

        {activeTab === 'Alerts' && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Inventory Alerts</h3>
                <p>Calculated from the current sample inventory</p>
              </div>
            </div>
            {renderAlerts()}
          </section>
        )}

        {activeTab === 'Reports' && (
          <section className="panel placeholder-panel">
            <div className="placeholder-icon">▤</div>
            <h2>Inventory Summary</h2>
            <p>Total medicine items: {medicines.length}</p>
            <p>Items requiring restock: {lowStock.length}</p>
            <p>Items expiring within 30 days: {expiringSoon.length}</p>
            <button
              className="primary-button"
              onClick={() => setActiveTab('Overview')}
            >
              Back to Overview
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
