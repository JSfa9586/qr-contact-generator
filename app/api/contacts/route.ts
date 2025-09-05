import { NextRequest, NextResponse } from 'next/server';
import { ContactInfo } from '@/types/contact';
import { getContacts, saveContact, deleteContact } from '@/lib/storage';

// 연락처 목록 조회
export async function GET() {
  try {
    const contacts = await getContacts();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('연락처 조회 오류:', error);
    return NextResponse.json({}, { status: 200 }); // 빈 객체 반환
  }
}

// 연락처 저장/수정
export async function POST(request: NextRequest) {
  try {
    const contactInfo: Partial<ContactInfo> = await request.json();
    
    // 필수 필드 검증
    if (!contactInfo.firstName && !contactInfo.lastName && !contactInfo.phone && !contactInfo.email) {
      return NextResponse.json(
        { error: '최소한 이름이나 전화번호, 이메일 중 하나는 입력해야 합니다.' },
        { status: 400 }
      );
    }

    // ContactInfo 형태로 변환 (기본값 설정)
    const contact: ContactInfo = {
      id: contactInfo.id || `${contactInfo.lastName || ''}${contactInfo.firstName || ''}`,
      firstName: contactInfo.firstName || '',
      lastName: contactInfo.lastName || '',
      phone: contactInfo.phone || '',
      email: contactInfo.email || '',
      company: contactInfo.company || '',
      jobTitle: contactInfo.jobTitle || '',
      website: contactInfo.website || '',
      address: contactInfo.address || '',
    };

    const result = await saveContact(contact);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        contact: result.contact,
        url: `/contact/${encodeURIComponent(contact.id)}`
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('연락처 저장 오류:', error);
    return NextResponse.json(
      { error: '연락처 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 연락처 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await deleteContact(id);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: result.message.includes('찾을 수 없습니다') ? 404 : 500 }
      );
    }

  } catch (error) {
    console.error('연락처 삭제 오류:', error);
    return NextResponse.json(
      { error: '연락처 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}