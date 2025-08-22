import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasTeacherPermissions } from '../../utils/permissions';
import ConsultationForm from './ConsultationForm';
import consultationService from '../../services/consultationService';
import toast from 'react-hot-toast';

const ConsultationsPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const isTeacher = hasTeacherPermissions(user);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      let response;
      if (isTeacher) {
        response = await consultationService.getTeacherConsultationRequests();
      } else {
        response = await consultationService.getStudentConsultationRequests();
      }
      
      if (response.success) {
        setConsultations(response.data || []);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);

    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await consultationService.updateConsultationRequestStatus(requestId, status);
      toast.success(`Request ${status} successfully`);
      loadConsultations(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update request status');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Please log in to access consultations
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isTeacher ? 'Consultation Requests' : 'My Consultations'}
            </h1>
            <p className="text-foreground/60">
              {isTeacher 
                ? 'Review and manage consultation requests from students'
                : 'Book consultation hours with your teachers'
              }
            </p>
          </div>
          
          {!isTeacher && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
            >
              Request Consultation
            </button>
          )}
        </div>

        {/* Consultations List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {isTeacher ? 'Pending Requests' : 'Your Requests'}
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-foreground/60">Loading...</div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-foreground/60">
                {isTeacher 
                  ? 'No consultation requests yet.'
                  : 'No consultation requests yet. Click the button above to create your first request.'
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div key={consultation._id} className="border border-border rounded-lg p-4 bg-background">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {consultation.topic}
                      </h3>
                      <p className="text-sm text-foreground/60 mb-2">
                        Course: {consultation.course?.title || 'Unknown Course'}
                      </p>
                      <p className="text-sm text-foreground/60 mb-2">
                        {isTeacher 
                          ? `Student: ${consultation.student?.name || 'Unknown Student'}`
                          : `Teacher: ${consultation.teacher?.name || 'Unknown Teacher'}`
                        }
                      </p>
                      <p className="text-sm text-foreground/60 mb-2">
                        Date: {new Date(consultation.proposedDateTime).toLocaleString()}
                      </p>
                      {consultation.description && (
                        <p className="text-sm text-foreground/80">{consultation.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        consultation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        consultation.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                      </span>
                      
                      {isTeacher && consultation.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(consultation._id, 'approved')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(consultation._id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ConsultationForm 
          onClose={() => {
            setShowForm(false);
            loadConsultations(); // Refresh the list after form closes
          }} 
        />
      )}
    </div>
  );
};

export default ConsultationsPage;
