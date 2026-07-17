import type { IconName } from './icons'

export interface HabitPreset {
  icon: IconName
  name: string
  categoryId: string
}

export const HABIT_PRESETS: HabitPreset[] = [
  { icon: 'world', name: 'Dil öğren', categoryId: 'egitim' },
  { icon: 'book', name: 'Kitap oku', categoryId: 'egitim' },
  { icon: 'water', name: 'Su iç', categoryId: 'saglik' },
  { icon: 'barbell', name: 'Egzersiz yap', categoryId: 'fitness' },
  { icon: 'dental', name: 'Dişlerini fırçala', categoryId: 'saglik' },
  { icon: 'yoga', name: 'Meditasyon yap', categoryId: 'zihin' },
  { icon: 'salad', name: 'Sağlıklı beslen', categoryId: 'saglik' },
  { icon: 'walk', name: 'Yürüyüşe çık', categoryId: 'fitness' },
  { icon: 'bed', name: 'Yatağını topla', categoryId: 'gelisim' },
  { icon: 'sleep', name: 'Uyku rutinini tamamla', categoryId: 'saglik' },
  { icon: 'calendar', name: 'Yarını planla', categoryId: 'uretkenlik' },
  { icon: 'inbox', name: 'Gelen kutunu kontrol et', categoryId: 'uretkenlik' },
  { icon: 'pencil', name: 'Günlük tut', categoryId: 'zihin' },
  { icon: 'pill', name: 'Vitaminini al', categoryId: 'saglik' },
  { icon: 'barbell', name: 'Spor salonuna git', categoryId: 'fitness' },
  { icon: 'stretching', name: 'Esneme yap', categoryId: 'fitness' },
  { icon: 'vacuum', name: 'Evi süpür', categoryId: 'gelisim' },
  { icon: 'laundry', name: 'Çamaşırları yıka', categoryId: 'gelisim' },
  { icon: 'trash', name: 'Çöpü çıkar', categoryId: 'gelisim' },
  { icon: 'home', name: 'Evi topla', categoryId: 'gelisim' },
  { icon: 'bone', name: 'Evcil dostuna mama ver', categoryId: 'sosyal' },
  { icon: 'dog', name: 'Köpeğini gezdir', categoryId: 'sosyal' },
  { icon: 'receipt', name: 'Faturalarını kontrol et', categoryId: 'finans' },
  { icon: 'target', name: 'Günün hedefini belirle', categoryId: 'gelisim' },
]
