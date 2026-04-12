'use client';

import { useEffect, useState } from 'react';
import ProfilePage from '../../admin/profile/page';

export default function LabScientistProfilePage() {
  const [formData, setFormData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        clinical_preferences: {
          default_appointment_duration: user.clinical_preferences?.default_appointment_duration || 30,
          auto_finalize_results: user.clinical_preferences?.auto_finalize_results ?? false,
          notification_sounds: user.clinical_preferences?.notification_sounds ?? true,
          sidebar_collapsed: user.clinical_preferences?.sidebar_collapsed ?? false
        }
      });
    }
  }, [user]);

  return <ProfilePage />;
}
