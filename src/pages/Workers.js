import { useEffect, useState } from "react";
import app from "../firebase";
import { getFirestore, collection, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState(null);
  const [selectedMgmtWorker, setSelectedMgmtWorker] = useState(null);

  useEffect(() => {
    const db = getFirestore(app);
    const unsub = onSnapshot(
      collection(db, "SkilledWorkers"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWorkers(list);
        setWorkersLoading(false);
        setWorkersError(null);
        if (list.length && !selectedMgmtWorker) setSelectedMgmtWorker(list[0]);
      },
      (err) => {
        setWorkersError(err.message || String(err));
        setWorkersLoading(false);
      }
    );
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="workers-management" style={{display:'flex', gap:16, height:'100%'}}>
      <div style={{width:320, borderRight:'1px solid #eee', overflowY:'auto'}}>
        <div style={{padding:'12px 12px 8px 12px', borderBottom:'1px solid #eee'}}>
          <h2 style={{margin:0, fontSize:18}}>All Skilled Workers</h2>
        </div>
        {workersLoading && (<div style={{padding:12}}>Loading workers…</div>)}
        {workersError && (<div style={{padding:12, color:'#b91c1c'}}>Error: {workersError}</div>)}
        {!workersLoading && !workersError && workers.length === 0 && (<div style={{padding:12}}>No workers found.</div>)}
        <div>
          {workers.map(w => (
            <div key={w.id} onClick={() => setSelectedMgmtWorker(w)} style={{padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, backgroundColor: selectedMgmtWorker?.id === w.id ? '#f0f9ff' : 'transparent'}}>
              <img src={w.ProfilePicture || w.profileImage || w.avatar || w.photo || 'https://via.placeholder.com/36'} alt={w.Name || w.displayName || w.name || 'Worker'} style={{width:36, height:36, borderRadius:20, objectFit:'cover'}} />
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {w.Name || w.displayName || w.name || 'Unnamed Worker'}
                </div>
                <div style={{fontSize:12, color:'#666'}}>
                  {w.City || w.city || '—'} {w.isActive === false && <span style={{color:'#b91c1c'}}>• disabled</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1, overflowY:'auto'}}>
        <div style={{padding:16}}>
          <h2 style={{marginTop:0}}>Worker Details</h2>
          {!selectedMgmtWorker && <div>Select a worker from the list.</div>}
          {selectedMgmtWorker && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <img src={selectedMgmtWorker.ProfilePicture || selectedMgmtWorker.profileImage || 'https://via.placeholder.com/64'} alt="avatar" style={{width:64, height:64, borderRadius:8, objectFit:'cover'}} />
                  <div>
                    <div style={{fontSize:20, fontWeight:700}}>{selectedMgmtWorker.Name || selectedMgmtWorker.displayName || selectedMgmtWorker.name}</div>
                    <div style={{color:'#555'}}>{selectedMgmtWorker.City || selectedMgmtWorker.city || '—'}</div>
                  </div>
                </div>
                <div style={{marginTop:16}}>
                  <div><strong>Phone:</strong> {selectedMgmtWorker.phoneNumber || selectedMgmtWorker.phone || '—'}</div>
                  <div><strong>Email:</strong> {selectedMgmtWorker.email || '—'}</div>
                  <div><strong>CNIC:</strong> {selectedMgmtWorker.cnic || '—'}</div>
                  <div><strong>Skills:</strong> {(selectedMgmtWorker.categories || selectedMgmtWorker.skills || []).join(', ') || '—'}</div>
                  <div><strong>Status:</strong> {selectedMgmtWorker.isActive === false ? 'Disabled' : 'Active'}</div>
                </div>
                <div style={{display:'flex', gap:10, marginTop:16}}>
                  <button className="remove-job-btn" onClick={async () => {
                    try {
                      const db = getFirestore(app);
                      await updateDoc(doc(db, 'SkilledWorkers', selectedMgmtWorker.id), { isActive: selectedMgmtWorker.isActive === false ? true : false });
                      setSelectedMgmtWorker(prev => ({...prev, isActive: prev.isActive === false ? true : false }));
                    } catch (e) {
                      alert('Failed to toggle active status');
                    }
                  }}>
                    {selectedMgmtWorker.isActive === false ? 'Enable' : 'Disable'}
                  </button>
                  <button className="remove-job-btn" onClick={async () => {
                    if (!window.confirm('Delete this worker? This cannot be undone.')) return;
                    try {
                      const db = getFirestore(app);
                      await deleteDoc(doc(db, 'SkilledWorkers', selectedMgmtWorker.id));
                      setSelectedMgmtWorker(null);
                    } catch (e) {
                      alert('Failed to delete worker');
                    }
                  }}>
                    Delete
                  </button>
                </div>
              </div>
              <div>
                <div style={{fontWeight:600, marginBottom:8}}>Recent Info</div>
                <div style={{background:'#fafafa', border:'1px solid #eee', borderRadius:8, padding:12}}>
                  <div><strong>Assigned Job ID:</strong> {selectedMgmtWorker.assignedJobId || '—'}</div>
                  <div><strong>Current Job ID:</strong> {selectedMgmtWorker.currentJobId || '—'}</div>
                  <div><strong>Job Assigned:</strong> {selectedMgmtWorker.jobAssigned ? 'Yes' : 'No'}</div>
                  <div><strong>Verified:</strong> {selectedMgmtWorker.isVerified ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Workers;


