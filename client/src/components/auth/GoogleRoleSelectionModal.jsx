import React, { useState } from 'react';
import { User, GraduationCap, Users, Shield, X } from 'lucide-react';

const GoogleRoleSelectionModal = ({ isOpen, onClose, onRoleSelect, userData }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      value: 'Student',
      label: 'Student',
      description: 'I want to learn and develop new skills',
      icon: GraduationCap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      value: 'Teacher',
      label: 'Teacher',
      description: 'I want to create and share educational content',
      icon: User,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      value: 'Parent',
      label: 'Parent',
      description: 'I want to monitor and support my child\'s learning',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      value: 'Admin',
      label: 'Administrator',
      description: 'I want to manage the platform and users',
      icon: Shield,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await onRoleSelect(selectedRole);
    } catch (error) {
      console.error('Role selection error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Complete Your Registration</h2>
            <p className="text-foreground/80 mt-1">Please select your role to continue</p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {userData && (
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              {userData.profilePhoto && (
                <img
                  src={userData.profilePhoto}
                  alt={userData.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-foreground">{userData.name}</p>
                <p className="text-sm text-foreground/60">{userData.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Role Selection */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <label
                  key={role.value}
                  className={`block cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedRole === role.value
                      ? `${role.borderColor} ${role.bgColor}`
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${role.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{role.label}</h3>
                      <p className="text-sm text-foreground/80 mt-1">{role.description}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={!selectedRole || isSubmitting}
              className="cosmic-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Completing Registration...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleRoleSelectionModal; 