'use client';

import { useState, useEffect } from 'react';
import { ContactInfo, ContactsDatabase } from '@/types/contact';

export default function AdminPanel() {
  const [contactInfo, setContactInfo] = useState<Partial<ContactInfo>>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    jobTitle: '',
    website: '',
    address: '',
  });

  const [contacts, setContacts] = useState<ContactsDatabase>({});
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 연락처 목록 로드
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('연락처 로드 오류:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveContact = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactInfo),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        await loadContacts(); // 연락처 목록 새로고침
        
        // 성공 시 URL 표시
        if (result.url) {
          setMessage({ 
            type: 'success', 
            text: `${result.message} 동적 URL: ${window.location.origin}${result.url}` 
          });
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
      console.error('저장 오류:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSelectedContact = (contactId: string) => {
    if (contactId && contacts[contactId]) {
      setContactInfo(contacts[contactId]);
      setSelectedContact(contactId);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('정말로 이 연락처를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: contactId }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        await loadContacts();
        
        // 삭제된 연락처가 선택되어 있다면 폼 초기화
        if (selectedContact === contactId) {
          clearForm();
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' });
      console.error('삭제 오류:', error);
    }
  };

  const clearForm = () => {
    setContactInfo({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      company: '',
      jobTitle: '',
      website: '',
      address: '',
    });
    setSelectedContact('');
    setMessage(null);
  };

  const fillDummyData = () => {
    setContactInfo({
      firstName: '길동',
      lastName: '홍',
      phone: '010-1234-5678',
      email: 'hong@company.com',
      company: 'ABC 회사',
      jobTitle: '부장',
      website: 'https://company.com',
      address: '서울시 강남구 테헤란로 123',
    });
  };

  const isFormValid = contactInfo.firstName || contactInfo.lastName || contactInfo.phone || contactInfo.email;
  const contactsList = Object.values(contacts);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📇 동적 명함 관리 시스템
          </h1>
          <p className="text-lg text-gray-600">
            명함 정보를 관리하고 동적 QR 코드 URL을 생성합니다
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 기존 연락처 목록 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">등록된 연락처</h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contactsList.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  등록된 연락처가 없습니다
                </p>
              ) : (
                contactsList.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                      <p className="text-xs text-blue-600">
                        /contact/{encodeURIComponent(contact.id)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadSelectedContact(contact.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                      >
                        삭제
                      </button>
                      <a
                        href={`/contact/${encodeURIComponent(contact.id)}`}
                        target="_blank"
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200"
                      >
                        미리보기
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 연락처 정보 입력 폼 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedContact ? '연락처 수정' : '새 연락처 등록'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fillDummyData}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  테스트 데이터
                </button>
                <button
                  onClick={clearForm}
                  className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition duration-200"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 메시지 표시 */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    성 *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={contactInfo.lastName || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="홍"
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={contactInfo.firstName || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="길동"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={contactInfo.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactInfo.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={contactInfo.company || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC 회사"
                  />
                </div>
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    직책
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={contactInfo.jobTitle || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="부장"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  웹사이트
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={contactInfo.website || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://company.com"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={contactInfo.address || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="서울시 강남구 테헤란로 123"
                />
              </div>

              <button
                onClick={saveContact}
                disabled={!isFormValid || isSaving}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
              >
                {isSaving ? '저장 중...' : (selectedContact ? '연락처 수정' : '연락처 저장')}
              </button>

              {/* 사용 안내 */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">💡 사용 방법</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. 연락처 정보를 입력하고 저장합니다</li>
                  <li>2. 생성된 URL을 동적 QR 코드에 연결합니다</li>
                  <li>3. QR 코드 스캔 시 해당 URL로 연결되어 vCard가 자동 다운로드됩니다</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}