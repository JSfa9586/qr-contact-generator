import { kv } from '@vercel/kv';
import { promises as fs } from 'fs';
import path from 'path';
import { ContactInfo, ContactsDatabase } from '@/types/contact';

const contactsFilePath = path.join(process.cwd(), 'data', 'contacts.json');
const KV_PREFIX = 'contacts:';

// 환경에 따라 KV 또는 로컬 파일 사용 결정
const isKVAvailable = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};

// KV에서 모든 연락처 조회
async function getContactsFromKV(): Promise<ContactsDatabase> {
  try {
    // KV에서 모든 연락처 키 조회
    const keys = await kv.keys(`${KV_PREFIX}*`);
    const contacts: ContactsDatabase = {};
    
    for (const key of keys) {
      const id = key.replace(KV_PREFIX, '');
      const contact = await kv.get<ContactInfo>(key);
      if (contact) {
        contacts[id] = contact;
      }
    }
    
    return contacts;
  } catch (error) {
    console.error('KV에서 연락처 조회 오류:', error);
    return {};
  }
}

// 로컬 파일에서 연락처 조회
async function getContactsFromFile(): Promise<ContactsDatabase> {
  try {
    const data = await fs.readFile(contactsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('로컬 파일에서 연락처 조회 실패, 빈 객체 반환');
    return {};
  }
}

// 연락처 목록 조회 (통합)
export async function getContacts(): Promise<ContactsDatabase> {
  if (isKVAvailable()) {
    return await getContactsFromKV();
  } else {
    return await getContactsFromFile();
  }
}

// 개별 연락처 조회
export async function getContact(id: string): Promise<ContactInfo | null> {
  if (isKVAvailable()) {
    try {
      return await kv.get<ContactInfo>(`${KV_PREFIX}${id}`);
    } catch (error) {
      console.error('KV에서 연락처 조회 오류:', error);
      return null;
    }
  } else {
    const contacts = await getContactsFromFile();
    return contacts[id] || null;
  }
}

// 연락처 저장
export async function saveContact(contact: ContactInfo): Promise<{ success: boolean; message: string; contact?: ContactInfo }> {
  const id = contact.id || `${contact.lastName}${contact.firstName}`;
  const now = new Date().toISOString();
  
  if (isKVAvailable()) {
    try {
      // 기존 연락처 확인
      const existingContact = await kv.get<ContactInfo>(`${KV_PREFIX}${id}`);
      const isUpdate = !!existingContact;
      
      const updatedContact: ContactInfo = {
        ...contact,
        id,
        createdAt: isUpdate ? existingContact.createdAt : now,
        updatedAt: now,
      };
      
      await kv.set(`${KV_PREFIX}${id}`, updatedContact);
      
      return {
        success: true,
        message: isUpdate ? '연락처가 수정되었습니다.' : '새 연락처가 저장되었습니다.',
        contact: updatedContact,
      };
    } catch (error) {
      console.error('KV에 연락처 저장 오류:', error);
      return {
        success: false,
        message: '연락처 저장 중 오류가 발생했습니다.',
      };
    }
  } else {
    try {
      // 로컬 파일 처리
      let contacts: ContactsDatabase = {};
      try {
        const data = await fs.readFile(contactsFilePath, 'utf8');
        contacts = JSON.parse(data);
      } catch (error) {
        console.log('새 연락처 파일을 생성합니다.');
      }
      
      const isUpdate = contacts[id];
      const updatedContact: ContactInfo = {
        ...contact,
        id,
        createdAt: isUpdate ? contacts[id].createdAt : now,
        updatedAt: now,
      };
      
      contacts[id] = updatedContact;
      await fs.writeFile(contactsFilePath, JSON.stringify(contacts, null, 2), 'utf8');
      
      return {
        success: true,
        message: isUpdate ? '연락처가 수정되었습니다.' : '새 연락처가 저장되었습니다.',
        contact: updatedContact,
      };
    } catch (error) {
      console.error('로컬 파일에 연락처 저장 오류:', error);
      return {
        success: false,
        message: '연락처 저장 중 오류가 발생했습니다.',
      };
    }
  }
}

// 연락처 삭제
export async function deleteContact(id: string): Promise<{ success: boolean; message: string }> {
  if (isKVAvailable()) {
    try {
      const contact = await kv.get(`${KV_PREFIX}${id}`);
      if (!contact) {
        return {
          success: false,
          message: '연락처를 찾을 수 없습니다.',
        };
      }
      
      await kv.del(`${KV_PREFIX}${id}`);
      return {
        success: true,
        message: '연락처가 삭제되었습니다.',
      };
    } catch (error) {
      console.error('KV에서 연락처 삭제 오류:', error);
      return {
        success: false,
        message: '연락처 삭제 중 오류가 발생했습니다.',
      };
    }
  } else {
    try {
      const data = await fs.readFile(contactsFilePath, 'utf8');
      const contacts: ContactsDatabase = JSON.parse(data);
      
      if (!contacts[id]) {
        return {
          success: false,
          message: '연락처를 찾을 수 없습니다.',
        };
      }
      
      delete contacts[id];
      await fs.writeFile(contactsFilePath, JSON.stringify(contacts, null, 2), 'utf8');
      
      return {
        success: true,
        message: '연락처가 삭제되었습니다.',
      };
    } catch (error) {
      console.error('로컬 파일에서 연락처 삭제 오류:', error);
      return {
        success: false,
        message: '연락처 삭제 중 오류가 발생했습니다.',
      };
    }
  }
}