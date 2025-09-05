import { notFound } from 'next/navigation';
import { ContactInfo } from '@/types/contact';
import { getContact } from '@/lib/storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

// vCard 생성 함수
function generateVCard(info: ContactInfo): string {
  const toQuotedPrintable = (str: string): string => {
    return str
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        if (code >= 32 && code <= 126 && char !== '=' && char !== '?') {
          return char;
        }
        const bytes = new TextEncoder().encode(char);
        return Array.from(bytes)
          .map(byte => '=' + byte.toString(16).toUpperCase().padStart(2, '0'))
          .join('');
      })
      .join('');
  };

  const fullName = `${info.firstName} ${info.lastName}`.trim();
  const hasKorean = (text: string) => /[ᄀ-ᇿ㄰-㆏가-힯]/g.test(text);
  
  let nameField = '';
  let fnField = '';
  
  if (hasKorean(info.lastName || '') || hasKorean(info.firstName || '')) {
    const encodedLastName = toQuotedPrintable(info.lastName || '');
    const encodedFirstName = toQuotedPrintable(info.firstName || '');
    const encodedFullName = toQuotedPrintable(fullName || 'No Name');
    nameField = `N;ENCODING=QUOTED-PRINTABLE:${encodedLastName};${encodedFirstName};;;`;
    fnField = `FN;ENCODING=QUOTED-PRINTABLE:${encodedFullName}`;
  } else {
    nameField = `N:${info.lastName || ''};${info.firstName || ''};;;`;
    fnField = `FN:${fullName || 'No Name'}`;
  }
  
  let orgField = '';
  let titleField = '';
  let adrField = '';
  
  if (info.company) {
    orgField = hasKorean(info.company) 
      ? `ORG;ENCODING=QUOTED-PRINTABLE:${toQuotedPrintable(info.company)}`
      : `ORG:${info.company}`;
  }
  
  if (info.jobTitle) {
    titleField = hasKorean(info.jobTitle)
      ? `TITLE;ENCODING=QUOTED-PRINTABLE:${toQuotedPrintable(info.jobTitle)}`
      : `TITLE:${info.jobTitle}`;
  }
  
  if (info.address) {
    adrField = hasKorean(info.address)
      ? `ADR;TYPE=WORK;ENCODING=QUOTED-PRINTABLE:;;${toQuotedPrintable(info.address)};;;;`
      : `ADR;TYPE=WORK:;;${info.address};;;;`;
  }
  
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    nameField,
    fnField,
    info.phone ? `TEL;TYPE=CELL:${info.phone.replace(/-/g, '')}` : '',
    info.email ? `EMAIL;TYPE=INTERNET:${info.email}` : '',
    orgField,
    titleField,
    info.website ? `URL:${info.website}` : '',
    adrField,
    'END:VCARD',
  ]
    .filter(line => line)
    .join('\r\n');

  return vcard;
}

export default async function ContactPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  
  // 연락처 데이터 조회
  const contact = await getContact(decodedId);
  
  if (!contact) {
    notFound();
  }

  const vCardData = generateVCard(contact);
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
            {contact.jobTitle && contact.company && (
              <p className="text-lg text-gray-600">{contact.jobTitle} @ {contact.company}</p>
            )}
          </div>

          {/* 연락처 정보 */}
          <div className="space-y-4 mb-8">
            {contact.phone && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  📞
                </div>
                <div>
                  <p className="text-sm text-gray-500">전화번호</p>
                  <p className="text-gray-900 font-medium">{contact.phone}</p>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  📧
                </div>
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="text-gray-900 font-medium">{contact.email}</p>
                </div>
              </div>
            )}

            {contact.website && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  🌐
                </div>
                <div>
                  <p className="text-sm text-gray-500">웹사이트</p>
                  <a href={contact.website} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 font-medium">
                    {contact.website}
                  </a>
                </div>
              </div>
            )}

            {contact.address && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  📍
                </div>
                <div>
                  <p className="text-sm text-gray-500">주소</p>
                  <p className="text-gray-900 font-medium">{contact.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* 자동 다운로드 버튼 */}
          <div className="space-y-4">
            <button
              onClick={() => {
                const blob = new Blob([vCardData], { type: 'text/vcard' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fullName}.vcf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition duration-200"
            >
              📇 연락처 저장하기
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                위 버튼을 클릭하면 자동으로 연락처 파일이 다운로드됩니다
              </p>
            </div>
          </div>

          {/* 사용 안내 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📱 사용 방법</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. "연락처 저장하기" 버튼 클릭</li>
              <li>2. 다운로드된 .vcf 파일 열기</li>
              <li>3. 연락처 앱에서 자동으로 정보 추가</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}