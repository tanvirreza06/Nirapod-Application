import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function Recenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng])
  }, [lat, lng, map])
  return null
}

function Track() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/track/${token}`)
        const json = await res.json()

        if (!res.ok) {
          setError(json.error || 'Could not load tracking')
          return
        }

        setError('')
        setData(json)
      } catch (err) {
        setError('Cannot reach server')
      }
    }

    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [token])

  if (error) {
    return <p style={{ textAlign: 'center', marginTop: 60 }}>{error}</p>
  }

  if (!data) {
    return <p style={{ textAlign: 'center', marginTop: 60 }}>Loading...</p>
  }

  const last = data.lastLocation
  const lat = last ? Number(last.lat) : null
  const lng = last ? Number(last.lng) : null
  const trail = data.trail.map((p) => [Number(p.lat), Number(p.lng)])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <h2>{data.name}</h2>
      <p>
        {data.status === 'active'
          ? 'SOS is active. Live location below.'
          : 'SOS has ended. She is safe.'}
      </p>

      {last ? (
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          style={{ height: 400, width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={trail} pathOptions={{ color: '#d62828' }} />
          <CircleMarker
            center={[lat, lng]}
            radius={10}
            pathOptions={{ color: '#d62828', fillColor: '#d62828', fillOpacity: 1 }}
          />
          <Recenter lat={lat} lng={lng} />
        </MapContainer>
      ) : (
        <p>Waiting for the first location...</p>
      )}
    </div>
  )
}

export default Track