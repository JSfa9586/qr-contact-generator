'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface ContactInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  jobTitle: string;
  website: string;
  address: string;
}

export default function Home() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    jobTitle: '',
    website: '',
    address: '',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const generateVCard = (info: ContactInfo): string => {
    // 최소한의 정보만 포함하여 QR 코드 데이터 크기 최소화
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:2.1', // 2.1 버전이 더 간결함
      `N:${info.lastName};${info.firstName}`,
      info.phone ? `TEL:${info.phone.replace(/-/g, '')}` : '', // 하이픈 제거로 데이터 절약
      info.email ? `EMAIL:${info.email}` : '',
      info.company ? `ORG:${info.company}` : '',
      'END:VCARD',
    ]
      .filter(line => line)
      .join('\n'); // \r\n 대신 \n만 사용

    return vcard;
  };

  // 간소화된 vCard 생성 (필수 정보만)
  const generateMinimalVCard = (info: ContactInfo): string => {
    const name = `${info.lastName}${info.firstName}`.trim();
    const phone = info.phone.replace(/-/g, '');
    
    // 가장 최소한의 vCard
    return [
      'BEGIN:VCARD',
      'VERSION:2.1',
      name ? `N:${info.lastName};${info.firstName}` : 'N:;',
      phone ? `TEL:${phone}` : '',
      info.email ? `EMAIL:${info.email}` : '',
      'END:VCARD',
    ]
      .filter(line => line)
      .join('\n');
  };

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // 필수 정보만 있는 경우 최소 vCard 사용
      const hasOnlyEssentials = !contactInfo.jobTitle && !contactInfo.website && !contactInfo.address;
      const vcard = hasOnlyEssentials 
        ? generateMinimalVCard(contactInfo) 
        : generateVCard(contactInfo);
      
      const url = await QRCode.toDataURL(vcard, {
        width: 500, // 고해상도로 생성 후 CSS로 축소
        margin: 0, // 여백 완전 제거
        errorCorrectionLevel: 'L', // 최소 오류 수정 (7% 복구)
        version: undefined, // 자동으로 최소 버전 선택
        maskPattern: undefined, // 최적 패턴 자동 선택
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        type: 'image/png',
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      alert('QR 코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${contactInfo.firstName || 'contact'}_${contactInfo.lastName || 'qr'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const fillDummyData = () => {
    setContactInfo({
      firstName: '길동',
      lastName: '홍',
      phone: '010-1234-5678',
      email: 'hgd@abc.kr', // 짧은 이메일로 변경
      company: 'ABC',
      jobTitle: '',
      website: '',
      address: '',
    });
  };

  // 최소 데이터 테스트용
  const fillMinimalData = () => {
    setContactInfo({
      firstName: '길동',
      lastName: '홍',
      phone: '01012345678', // 하이픈 없는 번호
      email: '',
      company: '',
      jobTitle: '',
      website: '',
      address: '',
    });
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
    setQrCodeUrl('');
  };

  const isFormValid = contactInfo.firstName || contactInfo.lastName || contactInfo.phone || contactInfo.email;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📇 연락처 QR 코드 생성기
          </h1>
          <p className="text-lg text-gray-600">
            QR 코드를 스캔하면 자동으로 주소록에 저장됩니다
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 입력 폼 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">연락처 정보 입력</h2>
              <div className="flex gap-2">
                <button
                  onClick={fillMinimalData}
                  className="px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition duration-200"
                  title="최소 정보만 입력 (1.2cm QR에 최적)"
                >
                  최소 데이터
                </button>
                <button
                  onClick={fillDummyData}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  테스트 데이터
                </button>
                <button
                  onClick={clearForm}
                  className="px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition duration-200"
                >
                  초기화
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    성 *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={contactInfo.lastName}
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
                    value={contactInfo.firstName}
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
                  value={contactInfo.phone}
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
                  value={contactInfo.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  회사명
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={contactInfo.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="회사명"
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
                  value={contactInfo.jobTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="대리"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  웹사이트
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={contactInfo.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={contactInfo.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="서울시 강남구..."
                />
              </div>

              <button
                onClick={generateQRCode}
                disabled={!isFormValid || isGenerating}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
              >
                {isGenerating ? 'QR 코드 생성 중...' : 'QR 코드 생성'}
              </button>
            </div>
          </div>

          {/* QR 코드 표시 영역 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">생성된 QR 코드</h2>
            
            <div className="flex flex-col items-center justify-center h-full">
              {qrCodeUrl ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="bg-gray-50 p-6 rounded-lg inline-block">
                      <img src={qrCodeUrl} alt="Contact QR Code" className="w-64 h-64" />
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        💡 <strong>명함 인쇄 팁:</strong> 1.2cm × 1.2cm 크기로 인쇄 시<br/>
                        최소한의 정보만 입력하면 인식률이 높아집니다.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={downloadQRCode}
                    className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    QR 코드 다운로드 (고해상도)
                  </button>

                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="font-semibold">사용 방법:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>스마트폰 카메라로 QR 코드를 스캔하세요</li>
                      <li>연락처 정보가 자동으로 표시됩니다</li>
                      <li>저장 버튼을 눌러 주소록에 추가하세요</li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-2">
                      ※ 데이터가 적을수록 작은 크기에서도 잘 인식됩니다
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg
                    className="mx-auto h-32 w-32 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="mt-4">연락처 정보를 입력하고 QR 코드를 생성하세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}